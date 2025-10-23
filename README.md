# Lugnuts Automotive – Next.js Frontend

A minimal storefront and admin UI that talks to the Java/Spring API at `http://localhost:8080/api/lugnuts`.

This guide explains how to install and run the app locally on a Mac (Intel or Apple Silicon), including required tools, environment configuration, and common troubleshooting.

---

## Prerequisites (macOS)

- Git
- Java 17+ and Maven or Gradle (to run your Spring Boot API)
- Node.js 18.18+ or 20+ and npm
- Homebrew (optional but recommended)

Quick install tips:

- Homebrew (if you don’t have it):
  ```bash
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  ```
- Java 17 (one option via brew):
  ```bash
  brew install openjdk@17
  ```
  After install, add to your shell (zsh):
  ```bash
  echo 'export PATH="/usr/local/opt/openjdk@17/bin:/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
  source ~/.zshrc
  ```
- Node.js (recommended via nvm so versions are easy to switch):
  ```bash
  brew install nvm
  mkdir -p ~/.nvm
  echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
  echo '[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && . "/opt/homebrew/opt/nvm/nvm.sh"' >> ~/.zshrc
  source ~/.zshrc
  nvm install 20
  nvm use 20
  ```

Verify tools:
```bash
java -version
mvn -v        # or ./gradlew -v if you use Gradle
node -v
npm -v
```

---

## 1) Start your Spring API (backend)

From your Spring project folder (not this repo), run one of:

- Maven:
  ```bash
  mvn spring-boot:run
  ```
- Gradle:
  ```bash
  ./gradlew bootRun
  ```

Confirm it’s running at `http://localhost:8080/api/lugnuts`:
```bash
curl http://localhost:8080/api/lugnuts/products
```
You should see JSON (a list of products or an empty array).

If you see CORS errors in the browser later, add a simple global CORS config to your Spring app:
```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig {
  @Bean
  public WebMvcConfigurer corsConfigurer() {
    return new WebMvcConfigurer() {
      @Override
      public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/lugnuts/**")
            .allowedOrigins("http://localhost:3000")
            .allowedMethods("GET","POST","PUT","DELETE","OPTIONS");
      }
    };
  }
}
```

---

## 2) Clone and install the frontend (this repo)

```bash
git clone <your-repo-url> lugnuts-frontend
cd lugnuts-frontend
npm install
```

Create `.env.local` to point the app at your API:
```bash
echo "NEXT_PUBLIC_API_BASE=http://localhost:8080/api/lugnuts" > .env.local
```

> The app defaults to this URL if `.env.local` is missing, but setting it explicitly is helpful when your API runs elsewhere.

---

## 3) Run the Next.js dev server

```bash
npm run dev
```
Then open http://localhost:3000 in your browser.

If port 3000 is busy:
```bash
PORT=4000 npm run dev
```

---

## 4) Use the app

- Storefront
  - Products: `/products`
  - Product details: `/products/<code>`
  - Search: `/search?q=<term>`
  - Category: `/categories/<category>` (shown only if your API exposes category/categoryName)
  - Cart: `/cart`
  - Checkout: `/checkout`
  - Order confirmation (after placing an order): `/order-confirmation/<orderNumber>`

- Admin
  - Landing: `/admin`
  - Customers: `/admin/customers`, `/admin/customers/new`, `/admin/customers/[id]`
  - Products: `/admin/products`, `/admin/products/new`, `/admin/products/[code]`
  - Orders: `/admin/orders`, `/admin/orders/new`

> Note: No authentication is enforced in this sample. Add auth before exposing admin publicly.

---

## 5) Production build (optional)

```bash
npm run build
npm start
```
Keep your Spring API running and reachable at `NEXT_PUBLIC_API_BASE`.

---

## Troubleshooting (macOS)

- API not reachable
  - Verify backend logs show it started on port 8080
  - `curl http://localhost:8080/api/lugnuts/products`
  - Update `.env.local` if your API base differs

- CORS errors in the browser
  - Ensure Spring CORS config allows your frontend origin (e.g., `http://localhost:3000`) and methods `GET, POST, PUT, DELETE, OPTIONS`

- Port conflict on 3000
  - Use `PORT=4000 npm run dev`

- Node version issues (Apple Silicon)
  - Prefer `nvm install 20 && nvm use 20`
  - If modules fail to build, run `rm -rf node_modules package-lock.json && npm install`

- Logo not showing on the home page
  - We serve `/public/logo.png` unoptimized to avoid dev optimizer glitches
  - File must exist at `public/logo.png`

- Next.js 15 dynamic params/search params
  - Server Components must `await` `params`/`searchParams`

- Order payload expectations differ
  - Adjust payloads in:
    - `src/app/checkout/page.jsx` (customer + items array)
    - Admin pages under `src/app/admin/*` if your API requires specific fields

---

## Project structure (quick glance)

- Frontend framework: Next.js 15 (React 19)
- Styling: Tailwind CSS 4
- Key files:
  - `src/lib/api.js` – API helper (set base with `NEXT_PUBLIC_API_BASE`)
  - `src/lib/cart.js` – localStorage cart
  - `src/app/*` – pages (storefront + admin)
  - `public/logo.png` – brand logo used on the home page
  - `next.config.mjs`, `package.json` – project config

---
