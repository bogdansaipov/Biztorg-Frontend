import { privacyPolicy } from "./privacy-policy";
import { termsOfService } from "./terms-of-service";
import { cookiePolicy } from "./cookie-policy";
import { listingRules } from "./listing-rules";

export const LEGAL_DOCS: Record<string, { title: string; date: string; content: string }> = {
  "privacy-policy": privacyPolicy,
  "terms-of-service": termsOfService,
  "cookie-policy": cookiePolicy,
  "listing-rules": listingRules,
};