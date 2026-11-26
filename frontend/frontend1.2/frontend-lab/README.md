# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Assignment 1.4: State management

The users directory uses TanStack Query for fetching and caching users and Zustand for UI state. JSONPlaceholder is read-only, so successful user creation patches the Query cache; newly created users are not persisted by the API.

Set `VITE_API_URL` to change the API base URL. For the Unit 2 users API, use `VITE_API_URL=http://localhost:3000/api` and adjust endpoints if that API uses a different path.

- **Server vs. client state:** Server state is remote data requiring caching, synchronization, retries, and refetching. Client state is local interface state such as search and view preferences.
- **Redux Toolkit vs. Zustand:** Redux Toolkit is a stronger choice for larger teams or complex cross-cutting state that benefits from standardized reducers, middleware, and devtools.
- **`staleTime`:** The 30-second `staleTime` marks query data fresh for 30 seconds; returning from a user detail page during that window does not refetch the users list.
- **Cache invalidation:** When the server is the source of truth, invalidate the users query after a successful create so the next fetch reads the canonical server result. This demo instead patches the cache because JSONPlaceholder does not persist writes.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
