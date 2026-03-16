export const parseBusinessCard = (rawText) => {
  const text = rawText.replace(/\n+/g, "\n").trim();

  const emails = [
    ...text.matchAll(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g),
  ].map((m) => m[0]);

  const websites = [
    ...text.matchAll(/(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-z]{2,}/g),
  ].map((m) => m[0]);

const phones = [...text.matchAll(/(\+?\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s-]?\d{3,5}[\s-]?\d{3,5}/g)]
  .map(m => m[0]);

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

export const deduplicateBatch = (rows) => {
  const seenEmails = new Set();
  const seenPhones = new Set();
  const duplicates = [];
  const unique = [];

  for (const row of rows) {
    const emails = row.email
      ? row.email.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
      : [];

    const phones = row.phoneNumbers
      ? row.phoneNumbers.split(",").map((p) => p.trim().replace(/\s+/g, "")).filter(Boolean)
      : [];

    const hasEmailDupe = emails.some((e) => seenEmails.has(e));
    const hasPhoneDupe = phones.some((p) => seenPhones.has(p));

    if (hasEmailDupe || hasPhoneDupe) {
      duplicates.push(row);
    } else {
      emails.forEach((e) => seenEmails.add(e));
      phones.forEach((p) => seenPhones.add(p));
      unique.push(row);
    }
  }

  return { unique, duplicates };
};