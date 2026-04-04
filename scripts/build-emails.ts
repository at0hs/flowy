import { render } from "@react-email/render";
import React from "react";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import ConfirmSignup from "../emails/confirm-signup";
import ChangeEmail from "../emails/change-email";

// React Emailコンポーネントで使うプレースホルダー。
// ビルド後のHTMLでSupabase Goテンプレート変数に置換される。
const CONFIRMATION_URL_PLACEHOLDER = "CONFIRMATION_URL_PLACEHOLDER";
const SUPABASE_CONFIRMATION_VAR = "{{ .ConfirmationURL }}";

const OUTPUT_DIR = join(process.cwd(), "supabase", "templates");

async function buildEmails() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const templates = [
    {
      element: React.createElement(ConfirmSignup, { confirmUrl: CONFIRMATION_URL_PLACEHOLDER }),
      output: "confirm-signup.html",
    },
    {
      element: React.createElement(ChangeEmail, { confirmUrl: CONFIRMATION_URL_PLACEHOLDER }),
      output: "change-email.html",
    },
  ];

  for (const { element, output } of templates) {
    const html = await render(element);
    const processed = html.replaceAll(CONFIRMATION_URL_PLACEHOLDER, SUPABASE_CONFIRMATION_VAR);
    writeFileSync(join(OUTPUT_DIR, output), processed, "utf-8");
    console.log(`✓ Built supabase/templates/${output}`);
  }
}

buildEmails().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
