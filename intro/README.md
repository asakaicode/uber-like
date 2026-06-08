# Uber-like 紹介サイト

このアプリの仕組みを説明する静的サイトです。メインのモノレポとは独立して動作します。

## 起動

モノレポ内にあるため、インストール時はワークスペースを無視してください。

```bash
cd intro
pnpm install --ignore-workspace
pnpm run start
```

ブラウザで http://localhost:4321 を開いてください。

## ビルド

```bash
pnpm run build
pnpm run preview
```
