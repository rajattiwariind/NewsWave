# NewsWave

A responsive public news website built with Java 17, Spring Boot, HTML, CSS, JavaScript, and MySQL. Readers do not need accounts.

## Features
- Responsive editorial-style UI and light/dark theme
- News categories, keyword search, featured lead story, refresh, and pagination
- Spring Boot REST endpoints proxy the NewsAPI key (the key is not exposed in browser JavaScript)
- Source attribution and direct links to original publisher articles
- MySQL persistence for article metadata and fallback cache
- No reader login or admin panel

## Requirements
- JDK 17 or newer
- IntelliJ IDEA
- MySQL 8+
- NewsAPI key from https://newsapi.org/

## 1. Create the database
Run this in MySQL Workbench or the MySQL command line:

```sql
CREATE DATABASE newswave;
```

## 2. Configure the database password
Open `src/main/resources/application.properties` and replace `YOUR_MYSQL_PASSWORD` with your local MySQL password, or set environment variables:

- `DB_URL=jdbc:mysql://localhost:3306/newswave?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC`
- `DB_USERNAME=root`
- `DB_PASSWORD=your_mysql_password`

## 3. Add your NewsAPI key
Create an API key at https://newsapi.org/register. Set an environment variable named `NEWS_API_KEY` to the key.

Windows PowerShell (for the current terminal session):

```powershell
$env:NEWS_API_KEY="paste-your-key-here"
$env:DB_PASSWORD="your-mysql-password"
```

Then start the app from that same terminal using `.\mvnw.cmd spring-boot:run` if Maven Wrapper is available, or run `NewsWaveApplication` from IntelliJ after setting those environment variables in Run > Edit Configurations > Environment variables.

For IntelliJ, an easy alternative is to edit `application.properties` and temporarily replace `${NEWS_API_KEY:}` with your key locally. Do not commit that key to GitHub. Prefer environment variables.

## 4. Run in IntelliJ
1. Extract the ZIP.
2. IntelliJ > **File > Open** > choose the extracted `NewsWave` folder (the one containing `pom.xml`).
3. Allow Maven to import dependencies.
4. Set JDK 17 in **File > Project Structure > Project SDK**.
5. Start MySQL and confirm the database password.
6. In **Run > Edit Configurations**, select the Spring Boot application and set environment variables `NEWS_API_KEY=your-key;DB_PASSWORD=your-password`.
7. Run `NewsWaveApplication`.
8. Open **http://localhost:8080**.

## REST endpoints
- `GET /api/news/headlines?category=general&page=1`
- `GET /api/news/headlines?category=technology&page=1`
- `GET /api/news/search?q=artificial%20intelligence&page=1`

Supported headline categories: `general`, `business`, `entertainment`, `health`, `science`, `sports`, `technology`.

## NewsAPI plan note
NewsAPI's free Developer plan is for development/testing only, has a limited request quota, and may delay articles. A public production website needs a plan whose terms permit production use, or a news provider/feed whose license permits public display. NewsAPI results do not include the full article; NewsWave links readers to the original publisher. Review the provider's current terms and attribution requirements before deployment.

## Troubleshooting
- **API key missing / no stories:** confirm `NEWS_API_KEY` is set in the process that runs IntelliJ, then restart the app.
- **401:** API key is invalid.
- **429:** provider request quota has been reached.
- **MySQL access denied:** check `DB_USERNAME` and `DB_PASSWORD`.
- **Port 8080 busy:** change `server.port` in `application.properties`.
- **Database connection error:** make sure MySQL service is running.
