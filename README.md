# Opally Hittegods - DIS eksamen HA(it) - CBS Efterår 2026

Hittegods-modul til Opallys hotelkunder (demo-hotel: Hotel Kastanje).

- **Kunden** opretter en sag på web (får besked på mail) eller ved at sende en SMS til hotellets nummer (får besked på SMS). Hver sag har et hemmeligt link, hvor kunden kan følge status.
- **Personalet** logger ind, registrerer fundne ting med billede, matcher dem med åbne sager og markerer dem som udleveret.
- **Admin** opretter nye medarbejdere.

Opbygget som 2semester-prog (Express, models/controllers/routes/services/middleware), men uden EJS: frontend er statiske filer i `public/`, som henter og sender data med `fetch()` mod et JSON-API.

## Struktur

```
src/
  server.js            starter appen efter db-forbindelse
  app.js               middleware (helmet, sessions, logging) og routes
  config.js            læser .env
  controllers/         logik pr. endpoint
  models/              SQL mod MySQL (Staff, LostCase, FoundItem)
  routes/              URL'er -> controllers
  services/            Twilio SMS, Nodemailer, Cloudinary
  middleware/          login-tjek, rate limiting, validering, fejl
public/                HTML, CSS og JS (fetch) til browseren
db/schema.sql          tabeller
scripts/               opret tabeller og første admin
```

## API

| Metode | Endpoint | Hvem | Formål |
|---|---|---|---|
| POST | `/api/cases` | Kunde | Opret sag fra webformular |
| GET | `/api/cases/public/:token` | Kunde | Se status på egen sag |
| POST | `/api/webhooks/sms` | Twilio | Indgående SMS opretter sag, svar er TwiML |
| POST | `/api/auth/login` | Personale | Log ind (session-cookie) |
| POST | `/api/auth/logout` | Personale | Log ud |
| GET | `/api/auth/me` | Personale | Hvem er logget ind |
| GET | `/api/cases` | Personale | Alle sager |
| PATCH | `/api/cases/:id/deliver` | Personale | Markér som udleveret |
| GET | `/api/found-items` | Personale | Alle fundne ting |
| POST | `/api/found-items` | Personale | Registrér fundet ting (multipart med billede) |
| POST | `/api/found-items/:id/match` | Personale | Match med sag og giv kunden besked |
| GET/POST | `/api/staff` | Admin | Se og opret medarbejdere |

## Kom i gang lokalt

Kræver Node.js og MySQL 8. På Mac:

```bash
brew install mysql@8.4
brew services start mysql@8.4
mysql -uroot -e "CREATE DATABASE hittegods; CREATE USER 'hittegods'@'localhost' IDENTIFIED BY 'hittegods'; GRANT ALL ON hittegods.* TO 'hittegods'@'localhost';"
```

(Eller med Docker: `docker compose up -d`.)

```bash
cp .env.example .env      # udfyld ADMIN_PASSWORD (og evt. Twilio, SMTP, Cloudinary)
npm install
npm run db:init           # opretter tabeller
npm run db:admin          # opretter første admin fra .env
npm run start
```

Appen kører på http://localhost:3000. Personale logger ind på http://localhost:3000/login.

Uden Twilio-, SMTP- eller Cloudinary-nøgler i `.env` virker appen stadig: SMS'er og mails skrives i konsollen, og billeder gemmes lokalt i `public/uploads/`.

### Test SMS-webhook lokalt

```bash
curl -X POST http://localhost:3000/api/webhooks/sms \
  --data-urlencode "From=+4512345678" \
  --data-urlencode "Body=Jeg har mistet min sorte taske" \
  --data-urlencode "MessageSid=SMtest1"
```

Signaturtjekket springes kun over, når `TWILIO_AUTH_TOKEN` er tom.
