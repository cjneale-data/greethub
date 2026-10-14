"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Avatar, Badge, Button, ButtonLink, ChipGroup, TemplateCard, TextField, Toggle } from "@/components/brand";
import type { Address } from "@greethub/shared";
import { DELETION_VENDORS } from "@/lib/shop/policies";
import type { Draft, Person, SavedAddress, UserRecord } from "@/lib/shop/types";
import { AddressFields, EMPTY_ADDRESS, quickErrors, type AddressDraft } from "./AddressFields";
import { Check, EmptyState, ErrorBox, Modal, SkeletonList } from "./ui";
import { api, refreshSession, useSession, useToast } from "./client";

const NAV = [
  { href: "/account", label: "Profile" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/drafts", label: "Drafts" },
  { href: "/account/people", label: "People" },
  { href: "/account/handwriting", label: "Handwriting" },
  { href: "/orders", label: "Orders" },
  { href: "/account/delete", label: "Delete account" },
];

export function AccountFrame({ children }: { children: ReactNode }) {
  const path = usePathname();
  const items = NAV.map((n) => (
    <Link key={n.href} href={n.href} aria-current={path === n.href ? "page" : undefined} className={n.href === path ? "gh-seg__item" : undefined}>
      {n.label}
    </Link>
  ));
  return (
    <div className="gs-page">
      <div className="gs-account">
        <nav className="gs-subnav" aria-label="Account">{items}</nav>
        <nav className="gs-subnav-m" aria-label="Account">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="gh-chip" aria-current={path === n.href ? "page" : undefined} style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div>{children}</div>
      </div>
    </div>
  );
}

/** Loads an account endpoint and bounces to sign-in on 401 ("Sign in to see this."). */
function useAccount<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    const r = await api<T>(url);
    if (r.status === 401) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}&reason=signin`;
      return;
    }
    if (!r.ok) return setError(r.data.error ?? "Something broke on our side. It's not you. Try again in a minute.");
    setError("");
    setData(r.data as T);
  }, [url]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);
  return { data, setData, error, reload: load };
}

function Shell({ title, action, children, error, reload, ready }: { title: string; action?: ReactNode; children: ReactNode; error: string; reload: () => void; ready: boolean }) {
  return (
    <div className="gs-stack gs-stack--lg">
      <div className="gs-row gs-row--between">
        <h1 className="gs-h2" style={{ margin: 0 }}>{title}</h1>
        {action}
      </div>
      {error ? <ErrorBox message={error} onRetry={reload} /> : !ready ? <SkeletonList rows={3} h={84} /> : children}
    </div>
  );
}

/* ---------- 11a profile ---------- */

export function ProfilePage() {
  const toast = useToast();
  const sp = useSearchParams();
  const { data, error, reload } = useAccount<{ profile: UserRecord | null; email: string }>("/api/account/profile");
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [seeded, setSeeded] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (data && !seeded) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFirst(data.profile?.firstName ?? "");
      setLast(data.profile?.lastName ?? "");
      setSeeded(true);
    }
  }, [data, seeded]);
  useEffect(() => {
    if (sp.get("signedin")) toast("You're in. Your card's saved.");
  }, [sp, toast]);

  async function save() {
    setBusy(true);
    const r = await api("/api/account/profile", { method: "PUT", json: { firstName: first, lastName: last } });
    setBusy(false);
    if (r.ok) {
      toast("Saved.");
      void refreshSession();
    } else toast(r.data.error ?? "We lost you for a second. Trying again.");
  }

  return (
    <Shell title="Your account" error={error} reload={reload} ready={!!data}>
      <form className="gs-panel gs-stack" onSubmit={(e) => { e.preventDefault(); void save(); }}>
        <div className="gs-form-grid">
          <TextField label="First name" value={first} onChange={(e) => setFirst(e.target.value)} autoComplete="given-name" hint="We use it to say hi, like a friend would." />
          <TextField label="Last name" value={last} onChange={(e) => setLast(e.target.value)} autoComplete="family-name" />
          <div className="gs-span2"><TextField label="Email" value={data?.email ?? ""} readOnly /></div>
        </div>
        <Toggle checked onChange={() => undefined}>Email me when a proof is ready (always on)</Toggle>
        <p className="gs-small gs-muted" style={{ margin: 0 }}>Each picture book comes with 3 page redraws and 2 free redos of the character sheet. A drawing that fails never uses one up.</p>
        {data?.profile?.acceptance && <p className="gs-small gs-muted" style={{ margin: 0 }}>Terms and Privacy accepted {new Date(data.profile.acceptance.at).toLocaleDateString("en-US")} (version {data.profile.acceptance.termsVersion}).</p>}
        <div className="gs-row">
          <Button type="submit" disabled={busy}>Save changes</Button>
          <SignOutButton />
        </div>
      </form>
    </Shell>
  );
}

export function SignOutButton() {
  const router = useRouter();
  return (
    <Button
      type="button"
      variant="secondary"
      onClick={async () => {
        await api("/api/auth/signout", { method: "POST" });
        await refreshSession();
        router.push("/");
      }}
    >
      Sign out
    </Button>
  );
}

/* ---------- 11b addresses ---------- */

export function AddressesPage() {
  const toast = useToast();
  const { data, setData, error, reload } = useAccount<{ addresses: SavedAddress[] }>("/api/account/addresses");
  const [editing, setEditing] = useState<{ id?: string; label: string; form: AddressDraft } | null>(null);
  const [errs, setErrs] = useState<Record<string, string>>({});

  async function saveIt() {
    if (!editing) return;
    const q = quickErrors(editing.form);
    setErrs(q);
    if (Object.keys(q).length) return;
    const body = { label: editing.label, address: editing.form };
    const r = editing.id ? await api<{ addresses: SavedAddress[] }>(`/api/account/addresses/${editing.id}`, { method: "PUT", json: body }) : await api<{ addresses: SavedAddress[] }>("/api/account/addresses", { method: "POST", json: body });
    if (!r.ok) return setErrs(r.data.fieldErrors as unknown as Record<string, string> ?? {}), toast(r.data.error ?? "Check the highlighted fields.");
    setData(r.data as { addresses: SavedAddress[] });
    setEditing(null);
    toast("Saved.");
  }
  async function makeDefault(a: SavedAddress) {
    const r = await api<{ addresses: SavedAddress[] }>(`/api/account/addresses/${a.id}`, { method: "PUT", json: { isDefault: true } });
    if (r.ok) setData(r.data as { addresses: SavedAddress[] });
  }
  async function remove(a: SavedAddress) {
    const r = await api<{ addresses: SavedAddress[] }>(`/api/account/addresses/${a.id}`, { method: "DELETE" });
    if (!r.ok) return;
    setData(r.data as { addresses: SavedAddress[] });
    toast("Removed.", { action: "Undo", ms: 5000, onAction: () => void api<{ addresses: SavedAddress[] }>("/api/account/addresses", { method: "POST", json: { restore: a } }).then((x) => x.ok && setData(x.data as { addresses: SavedAddress[] })) });
  }

  return (
    <Shell title="Addresses" error={error} reload={reload} ready={!!data} action={<Button variant="secondary" onClick={() => { setErrs({}); setEditing({ label: "", form: { ...EMPTY_ADDRESS } }); }}>+ Add an address</Button>}>
      {data && data.addresses.length === 0 ? (
        <EmptyState message="No saved addresses. We'll offer to save one at checkout." actions={[{ label: "Add an address", href: "#" }]} />
      ) : (
        <div className="gs-stack">
          {data?.addresses.map((a) => (
            <div key={a.id} className="gs-panel gs-row gs-row--between">
              <div>
                <strong>{a.label}</strong> {a.isDefault && <Badge tone="new">Default</Badge>}
                <div className="gs-small gs-muted">{a.address.name}, {a.address.line1}, {a.address.city}, {a.address.region} {a.address.postalCode}</div>
              </div>
              <div className="gs-row">
                {!a.isDefault && <Button size="sm" variant="ghost" onClick={() => makeDefault(a)}>Make default</Button>}
                <Button size="sm" variant="secondary" onClick={() => { setErrs({}); setEditing({ id: a.id, label: a.label, form: { ...EMPTY_ADDRESS, ...(a.address as Address) } }); }}>Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => remove(a)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}
      {editing && (
        <Modal title={editing.id ? "Edit address" : "Add an address"} onClose={() => setEditing(null)} actions={<><Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={saveIt}>Save</Button></>}>
          <div className="gs-stack">
            <TextField label="Label (Home, Rosa...)" value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })} />
            <AddressFields prefix="acct" value={editing.form} onChange={(form) => setEditing({ ...editing, form })} errors={errs} />
          </div>
        </Modal>
      )}
    </Shell>
  );
}

/* ---------- 11c drafts ---------- */

export function DraftsPage() {
  const toast = useToast();
  const [filter, setFilter] = useState("All");
  const [now] = useState(() => Date.now());
  const { data, setData, error, reload } = useAccount<{ drafts: Draft[] }>("/api/account/drafts");
  const list = (data?.drafts ?? []).filter((d) => filter === "All" || d.kind === (filter === "Cards" ? "card" : "book"));
  const ago = (iso: string) => {
    const days = Math.floor((now - new Date(iso).getTime()) / 86400000);
    return days <= 0 ? "Edited today" : `Edited ${days} day${days === 1 ? "" : "s"} ago`;
  };
  const daysLeft = (iso: string) => 90 - Math.floor((now - new Date(iso).getTime()) / 86400000);
  async function act(id: string, method: "DELETE" | "POST") {
    const r = await api<{ drafts: Draft[] }>(`/api/account/drafts/${id}`, { method });
    if (r.ok) {
      setData(r.data as { drafts: Draft[] });
      toast(method === "DELETE" ? "Removed." : "Saved.");
    }
  }
  return (
    <Shell title="Your drafts" error={error} reload={reload} ready={!!data}>
      <ChipGroup options={["All", "Cards", "Books"]} value={filter} onChange={setFilter} />
      {list.length === 0 ? (
        <EmptyState message="Nothing saved yet. Start a card and we'll keep it here." actions={[{ label: "Start a card", href: "/create/card" }]} />
      ) : (
        <div className="gs-grid">
          {list.map((d) => (
            <div key={d.id} className="gs-panel gs-stack gs-stack--sm">
              <div className="gs-draft-media"><TemplateCard title={d.title} tone={d.kind === "book" ? "marigold" : "blush"} tilt={0} image={d.thumbnail} placeholderLabel={d.kind} /></div>
              <div className="gs-row"><Badge tone="draft">{daysLeft(d.updatedAt) <= 15 ? `Expires in ${daysLeft(d.updatedAt)} days` : "Draft"}</Badge><span className="gs-small gs-muted">{ago(d.updatedAt)}</span></div>
              <div className="gs-row">
                <ButtonLink size="sm" variant="dark" href={`/create/${d.kind}?draft=${d.id}`}>Continue</ButtonLink>
                <Button size="sm" variant="ghost" onClick={() => act(d.id, "POST")}>Duplicate</Button>
                <Button size="sm" variant="ghost" onClick={() => act(d.id, "DELETE")}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
}

/* ---------- 11d people ---------- */

export function PeoplePage() {
  const toast = useToast();
  const { data, setData, error, reload } = useAccount<{ people: Person[] }>("/api/account/people");
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [rel, setRel] = useState("");
  const [age, setAge] = useState("adult");
  const [fe, setFe] = useState<Record<string, string>>({});
  const [del, setDel] = useState<Person | null>(null);

  async function add() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Required";
    if (!rel.trim()) e.rel = "Required";
    setFe(e);
    if (Object.keys(e).length) return;
    const r = await api<{ people: Person[] }>("/api/account/people", { method: "POST", json: { name, relationship: rel, ageBand: age } });
    if (!r.ok) return toast(r.data.error ?? "Check the highlighted fields.");
    setData(r.data as { people: Person[] });
    setAdding(false);
    setName("");
    setRel("");
    toast("Saved.");
  }
  async function remove() {
    if (!del) return;
    const r = await api<{ people: Person[] }>(`/api/account/people/${del.id}`, { method: "DELETE" });
    setDel(null);
    if (r.ok) {
      setData(r.data as { people: Person[] });
      toast("Removed.");
    }
  }
  return (
    <Shell title="People" error={error} reload={reload} ready={!!data} action={<Button variant="secondary" onClick={() => setAdding(true)}>+ Add a person</Button>}>
      {data && data.people.length === 0 ? (
        <EmptyState message="No one saved yet. Add Grandma once and she looks the same in every card." />
      ) : (
        <div className="gs-grid">
          {data?.people.map((p, i) => (
            <div key={p.id} className="gs-panel gs-person">
              <Avatar name={p.name} size={56} index={i} />
              <div style={{ flex: 1 }}>
                <strong>{p.name}</strong>
                <div className="gs-small gs-muted">{p.relationship}, used in {p.usedIn}</div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setDel(p)} aria-label={`Delete ${p.name}`}>Delete</Button>
            </div>
          ))}
        </div>
      )}
      {adding && (
        <Modal title="Add a person" onClose={() => setAdding(false)} actions={<><Button variant="ghost" onClick={() => setAdding(false)}>Cancel</Button><Button onClick={add}>Save</Button></>}>
          <div className="gs-stack">
            <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} error={fe.name} />
            <TextField label="Relationship" value={rel} onChange={(e) => setRel(e.target.value)} error={fe.rel} placeholder="Grandma, best friend..." />
            <ChipGroup options={["baby", "toddler", "child", "teen", "adult", "senior", "pet"]} value={age} onChange={setAge} />
            <p className="gs-small gs-muted" style={{ margin: 0 }}>Photos and the character sheet are added in the creator. Photos of children need a parent or guardian&apos;s OK.</p>
          </div>
        </Modal>
      )}
      {del && (
        <Modal title={`Delete ${del.name}?`} onClose={() => setDel(null)} actions={<><Button variant="ghost" onClick={() => setDel(null)}>Keep</Button><Button variant="dark" onClick={remove}>Delete</Button></>}>
          <p>Cards and books you&apos;ve already made keep their picture. New ones can&apos;t use them. Photos are purged within 30 days.</p>
        </Modal>
      )}
    </Shell>
  );
}

/* ---------- 11f delete account + export ---------- */

export function DeletePage() {
  const toast = useToast();
  const session = useSession();
  const [text, setText] = useState("");
  const [ack, setAck] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [sent, setSent] = useState<{ devLink?: string } | null>(null);
  const orders = useAccount<{ orders: { status: string }[] }>("/api/orders");
  const openOrders = (orders.data?.orders ?? []).filter((o) => !["delivered", "cancelled", "refunded"].includes(o.status)).length;

  async function request() {
    setBusy(true);
    setErr("");
    const r = await api<{ devLink?: string }>("/api/account/delete", { method: "POST", json: { confirmText: text, acknowledgeOpenOrders: ack } });
    setBusy(false);
    setOpen(false);
    if (!r.ok) return setErr(r.data.error ?? "Something broke on our side. It's not you. Try again in a minute.");
    setSent({ devLink: r.data.devLink });
    toast("Check your email to finish.");
  }
  const canStart = text === "DELETE" && (openOrders === 0 || ack);

  return (
    <Shell title="Delete your account" error={orders.error} reload={orders.reload} ready={!!orders.data}>
      <div className="gs-panel gs-stack">
        <p style={{ margin: 0 }}>This removes your profile, saved people, photos, handwriting and signatures, drafts and addresses. Orders already in production still ship. Order records are kept for tax and accounting, with your name and address removed after fulfillment.</p>
        <div>
          <h2 className="gs-h3">Where your data lives</h2>
          <ul className="gs-small gs-muted" style={{ margin: 0, paddingLeft: 18 }}>
            {DELETION_VENDORS.map((v) => <li key={v.name}><strong>{v.name}:</strong> {v.how}</li>)}
          </ul>
        </div>
        <p style={{ margin: 0 }}><a className="gs-link" href="/api/account/export" download>Download my data</a> (a JSON file of your profile, addresses, drafts, people, orders, and your books with the photo consent you gave)</p>
      </div>
      {sent ? (
        <div className="gs-panel gs-stack" role="status">
          <p style={{ margin: 0 }}><strong>Check your email.</strong> We sent a confirmation link to {session.email}. Nothing is deleted until you click it. It works for 15 minutes.</p>
          {sent.devLink && <div className="gs-devnote">Local mode: no email is really sent. <Link className="gs-link" data-testid="delete-link" href={sent.devLink}>Open the confirmation link</Link></div>}
        </div>
      ) : (
        <div className="gs-panel gs-stack">
          {err && <ErrorBox message={err} />}
          {openOrders > 0 && <Check checked={ack} onChange={setAck}>I know my open order will still ship and I&apos;ll lose its tracking page.</Check>}
          <TextField label="Type DELETE to confirm" value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" />
          <div className="gs-row">
            <Button variant="dark" disabled={!canStart} onClick={() => setOpen(true)}>Delete my account</Button>
            <ButtonLink variant="secondary" href="/account">Keep my account</ButtonLink>
          </div>
        </div>
      )}
      {open && (
        <Modal title="Delete your account?" onClose={() => setOpen(false)} actions={<><Button variant="ghost" onClick={() => setOpen(false)}>Keep it</Button><Button variant="dark" disabled={busy} onClick={request}>Email me the link</Button></>}>
          <p>We&apos;ll email a link to confirm. This can&apos;t be undone.</p>
        </Modal>
      )}
    </Shell>
  );
}

export function DeleteConfirm() {
  const sp = useSearchParams();
  const router = useRouter();
  const token = sp.get("token") ?? "";
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true);
    const r = await api<{ firstName: string | null }>("/api/account/delete/confirm", { method: "POST", json: { token } });
    setBusy(false);
    if (!r.ok) return setErr(r.data.error ?? "That link has expired. Send a new one?");
    await refreshSession();
    router.push(`/?deleted=1${r.data.firstName ? `&name=${encodeURIComponent(r.data.firstName)}` : ""}`);
  }
  return (
    <div className="gs-page gs-page--form">
      <div className="gs-auth gs-stack">
        <h1 className="gs-h2" style={{ margin: 0 }}>Delete your account</h1>
        <p className="gs-muted" style={{ margin: 0 }}>This removes your profile, saved people, photos, handwriting and signatures, drafts and addresses. It can&apos;t be undone.</p>
        {err && <ErrorBox message={err} />}
        <Button variant="dark" size="lg" disabled={busy || !token} onClick={go} data-testid="confirm-delete">Yes, delete everything</Button>
        <ButtonLink variant="secondary" href="/account">Keep my account</ButtonLink>
      </div>
    </div>
  );
}
