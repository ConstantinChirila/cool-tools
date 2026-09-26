// Prerendered per deployment, so it always reports the build the server is currently serving.
export const dynamic = "force-static";

export function GET() {
  return Response.json({ build: process.env.BUILD_ID });
}
