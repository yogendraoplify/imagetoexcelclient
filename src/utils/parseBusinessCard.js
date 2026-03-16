export const parseBusinessCard = (rawText) => {
  const text = rawText.replace(/\n+/g, "\n").trim();

  const emails = [
    ...text.matchAll(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g),
  ].map((m) => m[0]);

  const websites = [
    ...text.matchAll(/(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-z]{2,}/g),
  ].map((m) => m[0]);

  const phones = [
    ...text.matchAll(/(\+91[\s-]?)?\d{2,5}[\s-]?\d{6,8}|\d{10}/g),
  ].map((m) => m[0]);

  const companyMatch = text.match(
    /(.*(PVT\.?|PRIVATE|LTD\.?|LIMITED|CORPORATION|INDIA|TRADING|ELECTRONICS).*)/i
  );

  const positionMatch = text.match(
    /(Director|Manager|Engineer|Executive|Proprietor|Sales|Marketing|Owner)/i
  );

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const nameLine = lines.find(
    (l) =>
      /^[A-Z][a-z]+(\s[A-Z][a-z]+)+$/.test(l) &&
      !l.toLowerCase().includes("india")
  );

  const addressLines = lines.filter((l) =>
    /(road|rd|street|nagar|estate|mumbai|chennai|delhi|pin|400|600)/i.test(l)
  );

  return {
    contactPerson: nameLine || "",
    position:      positionMatch?.[0] || "",
    companyName:   companyMatch?.[0] || "",
    phoneNumbers:  [...new Set(phones)].join(", "),
    email:         [...new Set(emails)].join(", "),
    website:       [...new Set(websites)].join(", "),
    addresses:     [...new Set(addressLines)].join(" | "),
  };
};