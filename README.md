# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

# Instructions:
<br>
git clone
<br>
cd to folder
<br>
npm install
<br>
npm run dev

# Deploying to Render

[render.yaml](render.yaml) defines a static site for the frontend and a web service for the backend.

1. Push your changes to GitHub.
2. In the Render dashboard, choose **New > Blueprint** and select this repo.
3. When prompted for `VITE_API_URL`, enter the backend's URL, e.g. `https://bottle-back-api.onrender.com`.
4. Once deployed, check the backend's actual URL on its service page. If it differs, update `VITE_API_URL` on the static site and redeploy it.

This setup is for demos. Receipts are stored in memory and uploads on local disk, so both are lost whenever the backend restarts or spins down.