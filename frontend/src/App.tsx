
import { useState, type FormEvent } from "react";
import Admin from "./Admin";
import "./style.css";

const API_URL = (
    import.meta.env.VITE_API_URL || "http://127.0.0.1:3000"
).replace(/\/$/, "");

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || "";

const cats = [
  {
    id: 1,
    name: "Мурка",
    age: "3 месяца",
    gender: "Мальчик",
    description:
        "Любопытный и игривый малыш. Любит внимание, игры и новые знакомства.",
    image:
        "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=900&q=85",
    tag: "Маленький исследователь",
  },
  {
    id: 2,
    name: "Луна",
    age: "2 месяца",
    gender: "Девочка",
    description:
        "Нежная и ласковая кошечка. Ищет заботливую семью и уютный дом.",
    image:
        "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=900&q=85",
    tag: "Нежная душа",
  },
  {
    id: 3,
    name: "Симба",
    age: "4 месяца",
    gender: "Мальчик",
    description:
        "Активный и дружелюбный котёнок. Обожает исследовать окружающий мир.",
    image:
        "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=900&q=85",
    tag: "Энергия и радость",
  },
];

declare global {
  interface Window {
    gtag?: (
        command: string,
        eventName: string,
        parameters?: Record<string, string>,
    ) => void;
    ym?: (
        counterId: number,
        action: string,
        goalName: string,
    ) => void;
  }
}

export default function App() {
  const [showAdmin, setShowAdmin] = useState(false);
  const [catName, setCatName] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  function trackWhatsAppClick() {
    window.gtag?.("event", "whatsapp_click", {
      event_category: "contact",
      event_label: "WhatsApp",
    });

    const counterId = Number(import.meta.env.VITE_YANDEX_METRIKA_ID);

    if (counterId && Number.isFinite(counterId)) {
      window.ym?.(counterId, "reachGoal", "whatsapp_click");
    }
  }

  function selectCat(selectedCat: string) {
    setCatName(selectedCat);
    document.getElementById("adoption")?.scrollIntoView({
      behavior: "smooth",
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setResult("");

    try {
      const response = await fetch(`${API_URL}/api/adoptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cat_name: catName,
          name,
          phone,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error("Не удалось отправить заявку. Попробуйте ещё раз.");
      }

      window.gtag?.("event", "generate_lead", {
        event_category: "adoption",
        event_label: catName,
      });

      setResult("Заявка отправлена! Скоро мы с вами свяжемся.");
      setCatName("");
      setName("");
      setPhone("");
      setMessage("");
    } catch (error) {
      setResult(
          error instanceof Error
              ? error.message
              : "Не удалось соединиться с сервером.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (showAdmin) {
    return <Admin onBack={() => setShowAdmin(false)} />;
  }

  return (
      <div className="app">
        <header className="header">
          <a className="logo" href="#home" aria-label="Loki.cats — главная">
            <span className="logo-mark">l</span>
            <span>
            Loki<span className="logo-dot">.</span>cats
          </span>
          </a>

          <nav className="navigation">
            <a href="#cats">Наши котята</a>
            <a href="#about">О проекте</a>
            <a href="#adoption">Как помочь</a>
          </nav>

          <a className="header-button" href="#cats">
            Найти друга <span>↗</span>
          </a>
        </header>

        <main>
          <section className="hero" id="home">
            <div className="hero-content">
              <div className="eyebrow">
                <span className="eyebrow-line" />
                ДОМ НАЧИНАЕТСЯ С ЛЮБВИ
              </div>

              <h1>
                Не просто
                <br />
                питомец.
                <br />
                <span>Часть семьи.</span>
              </h1>

              <p className="hero-description">
                Маленькие лапки способны наполнить жизнь огромной любовью.
                Познакомься с котятами, которые ищут свой настоящий дом.
              </p>

              <div className="hero-actions">
                <a href="#cats" className="primary-button">
                  Познакомиться <span>↗</span>
                </a>
                <a href="#about" className="text-button">
                  Наша история <span>→</span>
                </a>
              </div>

              <div className="hero-note">
                <span className="note-heart">♥</span>
                Возможно, ваш лучший друг уже здесь.
              </div>
            </div>

            <div className="hero-visual">
              <div className="hero-photo-frame">
                <img
                    src={cats[0].image}
                    alt="Котёнок Loki.cats"
                    className="hero-photo"
                />
                <div className="photo-label">
                  <span className="photo-label-icon">✳</span>
                  <span>
                  <strong>Маленькие истории</strong>
                  <small>Большая любовь</small>
                </span>
                </div>
              </div>
              <div className="hero-sticker">найди<br />своего<br />друга ♡</div>
              <span className="hero-sparkle sparkle-one">✳</span>
              <span className="hero-sparkle sparkle-two">✳</span>
            </div>

            <div className="hero-bottom">
              <span>01 / 03</span>
              <span className="hero-bottom-line" />
              <span>МАЛЕНЬКИЕ ЛАПКИ — БОЛЬШОЕ СЧАСТЬЕ</span>
            </div>
          </section>

          <section className="cats-section section-wrap" id="cats">
            <div className="section-topline">
              <span className="eyebrow">ЗНАКОМЬТЕСЬ</span>
              <span className="section-number">01 — НАШИ КОТЯТА</span>
            </div>

            <div className="section-heading">
              <div>
                <h2>
                  Кто-то ждёт
                  <br />
                  <span>именно тебя.</span>
                </h2>
              </div>
              <p>
                У каждого свой характер, свои привычки и маленькая история.
                Но все они мечтают об одном — о любящей семье.
              </p>
            </div>

            <div className="cats-grid">
              {cats.map((cat, index) => (
                  <article className="cat-card" key={cat.id}>
                    <div className="cat-image-wrap">
                      <img
                          className="cat-image"
                          src={cat.image}
                          alt={`Котёнок ${cat.name}`}
                          loading="lazy"
                      />
                      <span className="cat-index">0{index + 1}</span>
                      <span className="cat-tag">{cat.tag}</span>
                    </div>

                    <div className="cat-info">
                      <div className="cat-title-row">
                        <h3>{cat.name}</h3>
                        <span className="cat-age">{cat.age}</span>
                      </div>

                      <span className="cat-gender">{cat.gender}</span>
                      <p>{cat.description}</p>

                      <button
                          className="card-button"
                          onClick={() => selectCat(cat.name)}
                      >
                        Хочу познакомиться <span>↗</span>
                      </button>
                    </div>
                  </article>
              ))}
            </div>
          </section>

          <section className="about-section" id="about">
            <div className="about-inner">
              <div className="about-visual">
                <div className="about-photo-frame">
                  <img
                      src={cats[1].image}
                      alt="Кошка, которая ищет дом"
                      loading="lazy"
                  />
                </div>
                <span className="about-heart">♡</span>
                <span className="about-caption">Дом там, где тебя любят.</span>
              </div>

              <div className="about-content">
                <div className="eyebrow">
                  <span className="eyebrow-line" />
                  ПОЧЕМУ МЫ ЭТО ДЕЛАЕМ
                </div>

                <h2>
                  У каждого
                  <br />
                  должна быть
                  <br />
                  <span>своя семья.</span>
                </h2>

                <p>
                  Loki.cats — небольшой проект, созданный с большой любовью
                  к животным. Мы помогаем котятам найти заботливых хозяев
                  и обрести безопасный, уютный дом.
                </p>

                <p>
                  Для нас пристройство — это не просто передача питомца.
                  Это начало новой истории, в которой есть место дружбе,
                  заботе и доверию.
                </p>

                <a href="#adoption" className="text-button about-link">
                  Стать частью этой истории <span>→</span>
                </a>
              </div>
            </div>
          </section>

          <section className="adoption-section section-wrap" id="adoption">
            <div className="section-topline">
              <span className="eyebrow">ТВОЙ ПЕРВЫЙ ШАГ</span>
              <span className="section-number">02 — ЗАЯВКА</span>
            </div>

            <div className="adoption-layout">
              <div className="adoption-copy">
                <h2>
                  Возможно,
                  <br />
                  вы уже
                  <br />
                  <span>нашли друг друга.</span>
                </h2>
                <p>
                  Расскажите немного о себе. Мы свяжемся с вами, ответим
                  на вопросы и поможем сделать первый шаг навстречу
                  новому другу.
                </p>

                <div className="adoption-promise">
                  <span>♡</span>
                  <p>
                    Никакой спешки.
                    <br />
                    Только забота и ответственное пристройство.
                  </p>
                </div>
              </div>

              <form className="adoption-form" onSubmit={handleSubmit}>
                <div className="form-heading">
                  <span>ЗАПОЛНИТЕ ФОРМУ</span>
                  <span>♡</span>
                </div>

                <label htmlFor="cat">Кого хотите забрать?</label>
                <select
                    id="cat"
                    value={catName}
                    onChange={(event) => setCatName(event.target.value)}
                    required
                >
                  <option value="">Выберите котёнка</option>
                  {cats.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                  ))}
                </select>

                <label htmlFor="name">Как вас зовут?</label>
                <input
                    id="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Ваше имя"
                    autoComplete="name"
                    required
                />

                <label htmlFor="phone">Номер телефона</label>
                <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="+7 700 000 00 00"
                    autoComplete="tel"
                    required
                />

                <label htmlFor="message">Немного о себе</label>
                <textarea
                    id="message"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Расскажите, в каких условиях будет жить котёнок..."
                    rows={4}
                />

                <button
                    className="primary-button submit-button"
                    type="submit"
                    disabled={loading}
                >
                  {loading ? "Отправляем..." : "Отправить заявку"}
                  <span>↗</span>
                </button>

                {result && (
                    <p className="form-result" role="status">
                      {result}
                    </p>
                )}

                <small className="form-privacy">
                  Нажимая кнопку, вы соглашаетесь на связь по указанному
                  номеру телефона.
                </small>
              </form>
            </div>
          </section>

          <section className="closing-section">
            <span className="closing-paw">✳</span>
            <p>ОДНА ВСТРЕЧА МОЖЕТ ИЗМЕНИТЬ ДВЕ ЖИЗНИ</p>
            <h2>
              Подари дом.
              <br />
              Получи целый мир.
            </h2>
            <a href="#cats" className="closing-button">
              Найти своего друга <span>↗</span>
            </a>
          </section>
        </main>

        <footer className="footer">
          <a className="logo footer-logo" href="#home">
            <span className="logo-mark">l</span>
            <span>
            Loki<span className="logo-dot">.</span>cats
          </span>
          </a>

          <p>Создано с любовью к маленьким друзьям.</p>

          {WHATSAPP_NUMBER ? (
              <a
                  className="footer-whatsapp"
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={trackWhatsAppClick}
              >
                Написать в WhatsApp ↗
              </a>
          ) : (
              <a className="footer-whatsapp" href="#adoption">
                Связаться с нами ↗
              </a>
          )}

          <button
              className="admin-link"
              onClick={() => setShowAdmin(true)}
              type="button"
          >
            Панель администратора
          </button>

          <span className="copyright">© 2026 Loki.cats</span>
        </footer>
      </div>
  );
}
