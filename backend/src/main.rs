
use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
    routing::get,
    Router,
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use tower_http::cors::{Any, CorsLayer};

#[derive(Clone)]
struct AppState {
    pool: PgPool,
    admin_token: String,
}

#[derive(Debug, Deserialize)]
struct AdoptionRequest {
    cat_name: String,
    name: String,
    phone: String,
    message: String,
}

#[derive(Debug, Deserialize)]
struct UpdateStatus {
    status: String,
}

#[derive(Debug, Serialize)]
struct Adoption {
    id: i64,
    cat_name: String,
    name: String,
    phone: String,
    message: String,
    status: String,
    created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize)]
struct ApiResponse {
    success: bool,
    message: String,
}

async fn health() -> &'static str {
    "Loki.cats API is running!"
}

async fn create_adoption(
    State(state): State<AppState>,
    Json(request): Json<AdoptionRequest>,
) -> (StatusCode, Json<ApiResponse>) {
    if request.cat_name.trim().is_empty()
        || request.name.trim().is_empty()
        || request.phone.trim().is_empty()
    {
        return (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse {
                success: false,
                message: "Заполните обязательные поля".into(),
            }),
        );
    }

    let result = sqlx::query(
        "INSERT INTO adoptions (cat_name, name, phone, message)
         VALUES ($1, $2, $3, $4)",
    )
        .bind(request.cat_name.trim())
        .bind(request.name.trim())
        .bind(request.phone.trim())
        .bind(request.message.trim())
        .execute(&state.pool)
        .await;

    match result {
        Ok(_) => (
            StatusCode::OK,
            Json(ApiResponse {
                success: true,
                message: "Заявка успешно принята!".into(),
            }),
        ),
        Err(error) => {
            eprintln!("Database error: {error}");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse {
                    success: false,
                    message: "Ошибка сохранения заявки".into(),
                }),
            )
        }
    }
}

async fn get_adoptions(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
) -> Result<Json<Vec<Adoption>>, StatusCode> {
    check_admin(&headers, &state.admin_token)?;

    let rows = sqlx::query_as!(
        Adoption,
        r#"
        SELECT id, cat_name, name, phone, message, status,
               created_at AS "created_at: chrono::DateTime<chrono::Utc>"
        FROM adoptions
        ORDER BY created_at DESC
        "#
    )
        .fetch_all(&state.pool)
        .await
        .map_err(|error| {
            eprintln!("Database error: {error}");
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(Json(rows))
}

async fn update_status(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    headers: axum::http::HeaderMap,
    Json(payload): Json<UpdateStatus>,
) -> StatusCode {
    if check_admin(&headers, &state.admin_token).is_err() {
        return StatusCode::UNAUTHORIZED;
    }

    let allowed = ["new", "reviewed", "approved", "rejected"];

    if !allowed.contains(&payload.status.as_str()) {
        return StatusCode::BAD_REQUEST;
    }

    match sqlx::query(
        "UPDATE adoptions SET status = $1 WHERE id = $2",
    )
        .bind(payload.status)
        .bind(id)
        .execute(&state.pool)
        .await
    {
        Ok(result) if result.rows_affected() > 0 => StatusCode::OK,
        Ok(_) => StatusCode::NOT_FOUND,
        Err(error) => {
            eprintln!("Database error: {error}");
            StatusCode::INTERNAL_SERVER_ERROR
        }
    }
}

async fn delete_adoption(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    headers: axum::http::HeaderMap,
) -> StatusCode {
    if check_admin(&headers, &state.admin_token).is_err() {
        return StatusCode::UNAUTHORIZED;
    }

    match sqlx::query("DELETE FROM adoptions WHERE id = $1")
        .bind(id)
        .execute(&state.pool)
        .await
    {
        Ok(result) if result.rows_affected() > 0 => StatusCode::NO_CONTENT,
        Ok(_) => StatusCode::NOT_FOUND,
        Err(error) => {
            eprintln!("Database error: {error}");
            StatusCode::INTERNAL_SERVER_ERROR
        }
    }
}

fn check_admin(
    headers: &axum::http::HeaderMap,
    expected_token: &str,
) -> Result<(), StatusCode> {
    let token = headers
        .get("x-admin-token")
        .and_then(|value| value.to_str().ok())
        .ok_or(StatusCode::UNAUTHORIZED)?;

    if token == expected_token {
        Ok(())
    } else {
        Err(StatusCode::UNAUTHORIZED)
    }
}

#[tokio::main]
async fn main() {
    let _ = dotenvy::dotenv();

    let database_url =
        std::env::var("DATABASE_URL").expect("DATABASE_URL not found");

    let admin_token =
        std::env::var("ADMIN_TOKEN").expect("ADMIN_TOKEN not found");

    let pool = PgPool::connect(&database_url)
        .await
        .expect("Database connection failed");

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS adoptions (
            id BIGSERIAL PRIMARY KEY,
            cat_name TEXT NOT NULL,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            message TEXT NOT NULL DEFAULT '',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )",
    )
        .execute(&pool)
        .await
        .expect("Table creation failed");

    sqlx::query(
        "ALTER TABLE adoptions
         ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'new'",
    )
        .execute(&pool)
        .await
        .expect("Status column creation failed");

    let state = AppState {
        pool,
        admin_token,
    };

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/api/health", get(health))
        .route("/api/adoptions", get(get_adoptions).post(create_adoption))
        .route(
            "/api/adoptions/{id}/status",
            axum::routing::patch(update_status),
        )
        .route(
            "/api/adoptions/{id}",
            axum::routing::delete(delete_adoption),
        )
        .with_state(state)
        .layer(cors);

    let port = std::env::var("PORT")
    .unwrap_or_else(|_| "3000".to_string());

let address = format!("0.0.0.0:{port}");

let listener = tokio::net::TcpListener::bind(&address)
    .await
    .expect("Server bind failed");

    println!("Loki.cats API listening on {address}");
    axum::serve(listener, app)
        .await
        .expect("Server error");
}
