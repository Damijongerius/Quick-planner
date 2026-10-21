export interface Email { subject: string; text: string; html: string }

export function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** A person's name goes in a subject line: no line breaks, no absurd length. */
export function oneLine(value: string, max = 120): string {
  return value.replace(/[\r\n]+/g, " ").trim().slice(0, max);
}

function layout(heading: string, paragraphs: string[], action?: { label: string; url: string }, footer?: string): string {
  const body = paragraphs.map((p) => `<p style="margin:0 0 14px;line-height:1.5">${p}</p>`).join("");
  const button = action
    ? `<p style="margin:22px 0"><a href="${escapeHtml(action.url)}" style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;display:inline-block">${escapeHtml(action.label)}</a></p><p style="margin:0 0 14px;font-size:12px;color:#6b7280">Or paste this link into your browser:<br>${escapeHtml(action.url)}</p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#f6f6f8;padding:24px;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#18181b"><div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px"><h1 style="margin:0 0 16px;font-size:18px">${escapeHtml(heading)}</h1>${body}${button}${footer ? `<p style="margin:22px 0 0;font-size:12px;color:#6b7280">${escapeHtml(footer)}</p>` : ""}</div></body></html>`;
}

export function inviteEmail(p: { inviterName: string; projectName: string; role: "EDITOR" | "VIEWER"; url: string }): Email {
  const who = oneLine(p.inviterName) || "Someone";
  const project = oneLine(p.projectName);
  const can = p.role === "VIEWER" ? "view and comment on" : "plan and edit";
  return {
    subject: `${who} invited you to “${project}”`,
    text: `${who} invited you to ${can} the project “${project}” in Quick Planner.\n\nAccept the invitation: ${p.url}\n\nSign in with this email address and you'll join automatically.`,
    html: layout(`You're invited to ${project}`, [`<strong>${escapeHtml(who)}</strong> invited you to ${can} the project <strong>${escapeHtml(project)}</strong>.`], { label: "Open the project", url: p.url }, "Sign in with this email address and you'll join automatically."),
  };
}

export function notificationEmail(p: { title: string; projectName: string; url: string }): Email {
  const title = oneLine(p.title, 200);
  const project = oneLine(p.projectName);
  return {
    subject: `${title}`.slice(0, 150),
    text: `${title}\n\nProject: ${project}\nOpen it: ${p.url}\n\nYou get these emails because notifications are on in your account settings.`,
    html: layout(title, [`In the project <strong>${escapeHtml(project)}</strong>.`], { label: "Open in Quick Planner", url: p.url }, "You get these emails because email notifications are on in your account settings."),
  };
}

export function magicLinkEmail(p: { url: string; host: string; minutes: number }): Email {
  return {
    subject: `Sign in to Quick Planner`,
    text: `Use this link to sign in to Quick Planner (${p.host}). It works once and expires in ${p.minutes} minutes.\n\n${p.url}\n\nIf you didn't ask for this, you can ignore this email.`,
    html: layout("Sign in to Quick Planner", [`Use the button below to sign in. The link works once and expires in ${p.minutes} minutes.`], { label: "Sign in", url: p.url }, "If you didn't ask for this, you can ignore this email."),
  };
}
