import { useState } from "react";

const API_URL = (
    import.meta.env.VITE_API_URL || "http://127.0.0.1:3000"
).replace(/\/$/, "");

type Adoption = {
    id: number;
    cat_name: string;
    name: string;
    phone: string;
    message: string;
    status: string;
    created_at: string;
};

type Props = {
    onBack: () => void;
};

const statuses: Record<string, string> = {
    new: "Новая",
    reviewed: "Рассмотрена",
    approved: "Одобрена",
    rejected: "Отклонена",
};

export default function Admin({ onBack }: Props) {
const [token, setToken] = useState("");
const [adoptions, setAdoptions] = useState<Adoption[]>([]);
const [loggedIn, setLoggedIn] = useState(false);
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");

    async function loadAdoptions() {
setLoading(true);
setError("");

try {
    const response = await fetch(`${API_URL}/api/adoptions`, {
    headers: {
"x-admin-token": token,
},
});

if (!response.ok) {
throw new Error(
response.status === 401 || response.status === 403
? "Неверный токен администратора"
: "Не удалось загрузить заявки",
);
}

const data: Adoption[] = await response.json();

setAdoptions(data);
setLoggedIn(true);
} catch (error) {
setError(
error instanceof Error ? error.message : "Ошибка соединения",
);
setLoggedIn(false);
} finally {
  setLoading(false);
  }
}

    async function updateStatus(id: number, status: string) {
try {
    const response = await fetch(
    `${API_URL}/api/adoptions/${id}/status`,
    {
    method: "PATCH",
    headers: {
"Content-Type": "application/json",
"x-admin-token": token,
},
body: JSON.stringify({ status }),
},
);

if (!response.ok) {
throw new Error("Не удалось изменить статус");
}

await loadAdoptions();
} catch (error) {
setError(
error instanceof Error ? error.message : "Ошибка обновления",
);
}
}

    async function deleteAdoption(id: number) {
    if (!window.confirm("Удалить эту заявку?")) {
    return;
}

try {
    const response = await fetch(`${API_URL}/api/adoptions/${id}`, {
    method: "DELETE",
    headers: {
"x-admin-token": token,
},
});

if (!response.ok) {
throw new Error("Не удалось удалить заявку");
}

await loadAdoptions();
} catch (error) {
setError(
error instanceof Error ? error.message : "Ошибка удаления",
);
}
}

    return (
    <main className="admin-page">
    <header className="admin-header">
    <button className="admin-back" onClick={onBack}>
← Вернуться на сайт
</button>

<h1>Панель администратора</h1>
<p>Управление заявками Loki.cats</p>
</header>

{!loggedIn ? (
<form
className="admin-login"
onSubmit={(event) => {
event.preventDefault();
    void loadAdoptions();
}}
>
<h2>Вход в систему</h2>

<label htmlFor="admin-token">Токен администратора</label>

<input
id="admin-token"
type="password"
value={token}
    onChange={(event) => setToken(event.target.value)}
    placeholder="Введите ADMIN_TOKEN"
    required
    />

    <button className="primary-button" disabled={loading}>
                                                         {loading ? "Проверяем..." : "Войти"}
</button>

{error && <p className="admin-error">{error}</p>}
</form>
) : (
<section className="admin-content">
<div className="admin-toolbar">
<div>
<h2>Заявки</h2>
<p>Всего заявок: {adoptions.length}</p>
</div>

<button
className="refresh-button"
onClick={() => void loadAdoptions()}
>
Обновить
</button>
</div>

{error && <p className="admin-error">{error}</p>}

{adoptions.length === 0 ? (
<div className="empty-state">
<span>📭</span>
<h3>Заявок пока нет</h3>
<p>Когда посетители отправят форму, они появятся здесь.</p>
</div>
) : (
<div className="applications">
{adoptions.map((item) => (
<article className="application-card" key={item.id}>
<div className="application-top">
<span className="application-id">Заявка №{item.id}</span>

<span className={`status status-${item.status}`}>
                                                {statuses[item.status] ?? item.status}
</span>
</div>

<h3>{item.cat_name}</h3>

<p>
<strong>Имя:</strong> {item.name}
</p>

<p>
<strong>Телефон:</strong> {item.phone}
</p>

<p>
<strong>Сообщение:</strong>{" "}
{item.message || "Без сообщения"}
</p>

<p className="application-date">
{new Date(item.created_at).toLocaleString("ru-RU")}
</p>

<label htmlFor={`status-${item.id}`}>
Изменить статус
</label>

<select
id={`status-${item.id}`}
    value={item.status}
    onChange={(event) =>
void updateStatus(item.id, event.target.value)
}
>
{Object.entries(statuses).map(([value, label]) => (
<option key={value} value={value}>
                                 {label}
</option>
))}
</select>

<button
className="delete-button"
onClick={() => void deleteAdoption(item.id)}
>
Удалить заявку
</button>
</article>
))}
</div>
)}

<button
className="admin-back logout-button"
onClick={() => {
setLoggedIn(false);
setToken("");
setAdoptions([]);
}}
>
Выйти из панели
</button>
</section>
)}
</main>
);
}
