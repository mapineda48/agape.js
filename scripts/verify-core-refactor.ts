import { upsertUser } from "../svc/core/user";
import { listDocumentTypes } from "../svc/core/documentType";
import initDatabase, { db } from "../lib/db";
import { user } from "../models/core/user";
import { person } from "../models/core/person";
import { company } from "../models/core/company";
import { eq } from "drizzle-orm";

async function main() {
  console.log("--- Verifying Core Refactor ---");

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set.");
  }

  await initDatabase(connectionString);

  // 1. List Document Types
  console.log("\n1. Listing Document Types...");
  const docTypes = await listDocumentTypes();
  console.log(`Found ${docTypes.length} document types.`);
  if (docTypes.length > 0) {
    console.log("First doc type:", docTypes[0]);
  } else {
    console.warn("No document types found. Please seed the database.");
    // Mocking a doc type ID for further tests if none exist
    // In a real scenario we might want to insert one here.
  }

  // Ensure we have a valid document type ID
  const docTypeId = docTypes.length > 0 ? docTypes[0].id : 1;

  // 2. Create User (Person)
  console.log("\n2. Creating User (Person)...");
  const personPayload = {
    type: "P",
    documentTypeId: docTypeId,
    documentNumber: `TEST-P-${Date.now()}`,
    email: `person-${Date.now()}@test.com`,
    person: {
      firstName: "Test",
      lastName: "Person",
    },
  };

  try {
    const createdPerson = await upsertUser(personPayload);
    console.log("Created Person:", createdPerson);

    // Verify it exists in DB
    const dbPerson = await db
      .select()
      .from(person)
      .where(eq(person.id, createdPerson.id));
    console.log("DB Person Record:", dbPerson[0]);
  } catch (error) {
    console.error("Error creating person:", error);
  }

  // 3. Create User (Company)
  console.log("\n3. Creating User (Company)...");
  const companyPayload = {
    type: "C",
    documentTypeId: docTypeId,
    documentNumber: `TEST-C-${Date.now()}`,
    email: `company-${Date.now()}@test.com`,
    company: {
      legalName: "Test Company Inc.",
      tradeName: "Test Co",
    },
  };

  try {
    const createdCompany = await upsertUser(companyPayload);
    console.log("Created Company:", createdCompany);

    // Verify it exists in DB
    const dbCompany = await db
      .select()
      .from(company)
      .where(eq(company.id, createdCompany.id));
    console.log("DB Company Record:", dbCompany[0]);
  } catch (error) {
    console.error("Error creating company:", error);
  }

  console.log("\n--- Verification Complete ---");
}

main()
  .catch(console.error)
  .finally(() => process.exit());
