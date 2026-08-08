import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: [
    "/",
    "/orders/:path*",
    "/customers/:path*",
    "/services/:path*",
    "/finance/:path*",
    "/users/:path*",
    "/api/report/:path*",
  ],
};