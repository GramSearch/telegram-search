![preview](./docs/assets/preview.png)

<h1 align="center">Telegram Search</h1>

<p align="center">
  [<a href="https://discord.gg/NzYsmJSgCT">Join Discord Server</a>] [<a href="https://github.com/GramSearch/telegram-search/blob/main/README.md">简体中文</a>]
</p>

<p align="center">
  <a href="https://deepwiki.com/GramSearch/telegram-search"><img src="https://deepwiki.com/badge.svg"></a>
  <a href="https://github.com/GramSearch/telegram-search/blob/main/LICENSE"><img src="https://img.shields.io/github/license/GramSearch/telegram-search.svg?style=flat&colorA=080f12&colorB=1fa669"></a>
    <a href="https://discord.gg/NzYsmJSgCT"><img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fdiscord.com%2Fapi%2Finvites%2FNzYsmJSgCT%3Fwith_counts%3Dtrue&query=%24.approximate_member_count&suffix=%20members&logo=discord&logoColor=white&label=%20&color=7389D8&labelColor=6A7EC2"></a>
  <a href="https://t.me/+Gs3SH2qAPeFhYmU9"><img src="https://img.shields.io/badge/Telegram-%235AA9E6?logo=telegram&labelColor=FFFFFF"></a>
</p>

> The only official website is `intentchat.app`, all other websites are scams.
>
> We have not issued any virtual currency, please do not be deceived.
>
> This software can only export your own chat records for search, please do not use it for illegal purposes.

<a href="https://trendshift.io/repositories/13868" target="_blank"><img src="https://trendshift.io/api/badge/repositories/13868" alt="groupultra%2Ftelegram-search | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>

A powerful Telegram chat history search tool that supports vector search and semantic matching. Based on OpenAI's semantic vector technology, it makes your Telegram message retrieval smarter and more precise.

- PR are welcome!
- Due to the project being in a rapid iteration phase, database incompatibility may occur. It's recommended to back up your data regularly.

## 💖 Sponsors

![Sponsors](https://github.com/luoling8192/luoling8192/raw/master/sponsorkit/sponsors.svg)

## 🚀 Quick Start

This is the simplest way to start Telegram Search, which will launch all necessary services (including the database and application server) via Docker.

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/GramSearch/telegram-search.git
    cd telegram-search
    ```

2.  **Configure settings:**
    Modify the settings in `config/config.yaml` as needed.\
    Make sure to change the `database.host` value in the configuration to the database container service name "pgvector".
    ```bash
    cp config/config.example.yaml config/config.yaml
    ```

3.  **Start the services:**

    ```bash
    docker compose up -d
    ```

Access `http://<host>:3333` to open the search interface.

## 💻 Local Run

1.  **Clone the repository**

    ```bash
    git clone https://github.com/GramSearch/telegram-search.git
    cd telegram-search
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install
    ```

3.  **Configure environment**:

    ```bash
    cp config/config.example.yaml config/config.yaml
    ```

4.  **Start the database container:**
    In local development mode, Docker is only used to start the database container.

    ```bash
    docker compose up -d pgvector
    ```

5.  **Synchronize database schema:**

    ```bash
    pnpm run db:migrate
    ```

6.  **Start services:**

    ```bash
    # Start backend service
    pnpm run dev:server

    # Start frontend interface
    pnpm run dev:frontend
    ```

Visit `http://localhost:3333` to open the search interface.

## 🚀 Activity

[![Star History Chart](https://api.star-history.com/svg?repos=luoling8192/telegram-search&type=Date)](https://star-history.com/#luoling8192/telegram-search&Date)

![Alt](https://repobeats.axiom.co/api/embed/c0fe5f057a33ce830a632c6ae421433f50e9083f.svg "Repobeats analytics image")

## 📝 License

MIT License © 2025
