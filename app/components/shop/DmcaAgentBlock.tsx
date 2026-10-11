/**
 * DMCA designated-agent block. PLACEHOLDER until the owner registers an agent with the U.S. Copyright Office
 * (https://www.copyright.gov/dmca-directory/, docs/legal/01 s3 item 7, docs/legal/07 s8) and fills these values in.
 * Do not remove the marker until the registration number is real.
 */
export const DMCA_AGENT = {
  registered: false,
  name: "[PLACEHOLDER: designated agent name]",
  company: "[PLACEHOLDER: company legal name]",
  address: "[PLACEHOLDER: postal address]",
  email: "[PLACEHOLDER: dmca@ address]",
  phone: "[PLACEHOLDER: phone]",
  registrationNumber: "[PLACEHOLDER: DMCA-1xxxxxx]",
};

export function DmcaAgentBlock({ compact = false }: { compact?: boolean }) {
  const a = DMCA_AGENT;
  return (
    <address className="gs-dmca" data-testid="dmca-agent" style={{ fontStyle: "normal", fontSize: compact ? "0.8em" : undefined }}>
      <strong>DMCA designated agent</strong>
      {!a.registered && <span> (PLACEHOLDER: not yet registered with the U.S. Copyright Office)</span>}
      <br />
      {a.name}, {a.company}
      <br />
      {a.address}
      <br />
      {a.email} | {a.phone} | Registration: {a.registrationNumber}
    </address>
  );
}
