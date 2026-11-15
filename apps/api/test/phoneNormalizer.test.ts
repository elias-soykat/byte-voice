import { normalizeBanglaPhone } from "../src/helpers/callExtractor";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

console.log("🧪 Testing Bangla Phone Normalizer...");

// 1. Bengali numerals conversion
const t1 = normalizeBanglaPhone("০১৭১২৩৪৫৬৭৮");
assert(t1.phone === "01712345678", `Expected 01712345678, got ${t1.phone}`);
assert(t1.isValid === true, "Expected t1 to be valid");

// 2. Spaces and international prefix
const t2 = normalizeBanglaPhone("+880 1812-345678");
assert(t2.phone === "01812345678", `Expected 01812345678, got ${t2.phone}`);
assert(t2.isValid === true, "Expected t2 to be valid");

// 3. Mixed digits and words
const t3 = normalizeBanglaPhone("আমার নম্বর 019 1122 3344");
assert(t3.phone === "01911223344", `Expected 01911223344, got ${t3.phone}`);
assert(t3.isValid === true, "Expected t3 to be valid");

// 4. Invalid phone
const t4 = normalizeBanglaPhone("12345");
assert(t4.isValid === false, "Expected t4 to be invalid");

console.log("✅ All Bangla Phone Normalizer tests passed!");
