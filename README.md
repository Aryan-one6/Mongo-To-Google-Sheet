# MongoDB to Google Sheets Sync

A Node.js watcher that listens for new documents in a MongoDB collection and pushes them to a Google Apps Script webhook for real-time syncing into Google Sheets.

---

## Table of Contents

* [Features](#features)
* [Prerequisites](#prerequisites)
* [Installation](#installation)
* [Configuration](#configuration)
* [Usage](#usage)
* [Environment Variables](#environment-variables)
* [Logging & Error Handling](#logging--error-handling)
* [Graceful Shutdown](#graceful-shutdown)
* [License](#license)

---

## Features

* 🌀 **Change Stream Watcher**: Listens for `insert` operations on your chosen collection.
* 📤 **Webhook Integration**: Posts newly inserted documents to any HTTP endpoint.
* 🔧 **Fully Configurable**: All settings (URIs, collection name, DB name, webhook URL) via environment variables.
* 📋 **Simple Logger**: Built-in info/warn/error logging.
* 🔒 **Secure**: No credentials checked into source — use a `.env` file.
* 🛑 **Graceful Shutdown**: Cleans up MongoDB connections and streams on exit.

## Prerequisites

* [Node.js](https://nodejs.org/) v14 or higher
* A MongoDB cluster with replica set enabled (needed for change streams)
* A deployed Google Apps Script or any HTTP endpoint to receive JSON payloads

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Aryan-one6/Mongo-To-Google-Sheet.git
   cd Mongo-To-Google-Sheet
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create your `.env` file** (see [Configuration](#configuration))

## Configuration

Create a `.env` file in the project root with these keys:

```dotenv
MONGO_URI="<your-mongodb-connection-string>"
DB_NAME="chatbot_db"
COLLECTION_NAME="user_queries"
WEBHOOK_URL="https://script.google.com/macros/s/your-script-id/exec"
```

> **Note:** Do **not** commit `.env` or any credential files. `.gitignore` is already configured to ignore them.

## Usage

Run the watcher:

```bash
node watcher-configurable.js
```

You should see logs:

```
ℹ️ Connected to MongoDB
ℹ️ Watching inserts on chatbot_db.user_queries
```

And upon new inserts, payloads will be POSTed to your webhook.

## Environment Variables

| Variable          | Description                            | Default        |
| ----------------- | -------------------------------------- | -------------- |
| `MONGO_URI`       | MongoDB connection string              | **required**   |
| `DB_NAME`         | Database name                          | `chatbot_db`   |
| `COLLECTION_NAME` | Collection to watch                    | `user_queries` |
| `WEBHOOK_URL`     | HTTP endpoint to post new documents to | **required**   |

## Logging & Error Handling

* Uses a simple logger wrapper (`info`, `warn`, `error`).
* Any errors in fetching or posting will be logged without crashing the watcher.

## Graceful Shutdown

The process listens for `SIGINT` (Ctrl+C) and will:

1. Close the change stream
2. Disconnect from MongoDB
3. Exit cleanly

## License

This project is licensed under the MIT License. Feel free to use, modify, and distribute.
