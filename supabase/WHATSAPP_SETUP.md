# Automatic WhatsApp sending (invoice / statement PDF)

The app calls the Supabase Edge Function `send-whatsapp` (code: `supabase/functions/send-whatsapp/index.ts`),
which sends the PDF through the WhatsApp Business Cloud API from the shop number (9440026692).

## One-time setup
1. **Meta business account** - https://business.facebook.com -> create a business (Thirumalakonda Plywoods).
2. **Developer app** - https://developers.facebook.com -> Create App -> type "Business" -> add the **WhatsApp** product.
3. **Add the sending number** - WhatsApp -> API Setup -> Add phone number -> 9440026692, verify by OTP.
   The number cannot stay on the normal WhatsApp app (the Business app "coexistence" option is the exception).
   Note the **Phone number ID** shown on the API Setup page.
4. **Permanent token** - Business Settings -> Users -> System users -> add one (Admin) -> Generate token with the
   permissions `whatsapp_business_messaging` and `whatsapp_business_management`, never expires. Copy it.
5. **Message template** (required to message people who have not written to you in the last 24 hours):
   WhatsApp Manager -> Message templates -> Create. Category **Utility**, name `tk_document`, language English,
   Header type **Document**, Body: `Hello {{1}}, {{2}}  - Thirumalakonda Plywoods`. Submit; approval usually takes minutes.
6. **Deploy the function** - Supabase dashboard -> Edge Functions -> Deploy a new function -> "Via Editor" ->
   name `send-whatsapp` -> paste `index.ts` -> turn **Verify JWT** OFF (the function checks the signed-in user itself) -> Deploy.
7. **Secrets** - Edge Functions -> Secrets (or Project Settings -> Edge Functions):
   - `WHATSAPP_TOKEN` = the permanent token
   - `WHATSAPP_PHONE_NUMBER_ID` = the Phone number ID
   - `WHATSAPP_TEMPLATE` = `tk_document`
   - `WHATSAPP_TEMPLATE_LANG` = `en` (use `en_US` if you created the template that way)

## Testing
Until the number is live, the Meta test number can only message numbers added to the allowed list in API Setup.
Open a customer -> Statement -> **Send on WhatsApp (PDF)**. Every sent message is recorded in the `message_log` table.

## If something fails
The app shows the reason and falls back to opening WhatsApp manually with the PDF downloaded.
Common reasons: template not approved, wrong Phone number ID, number still registered on the normal WhatsApp app.
