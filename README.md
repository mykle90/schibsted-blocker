# Aftenposten Quiet

En Chrome-utvidelse som skjuler Aftenpostens cookiebanner og rydder i kjente sporingscookies. Alt skjer lokalt i nettleseren, uten server, telemetri eller eksterne avhengigheter.

**Utvidelsen gjelder Aftenposten.** Navnet på repositoriet betyr ikke at den fungerer på alle Schibsted-nettsteder.

## Installer i Chrome

Du trenger Chrome 130 eller nyere. Utvidelsen installeres manuelt og ligger ikke i Chrome Nettmarked.

1. Trykk på den grønne **Code**-knappen i repositoriet og velg **Download ZIP**.
2. Pakk ut ZIP-filen til en mappe du vil beholde, for eksempel `Dokumenter\schibsted-blocker`.
3. Skriv `chrome://extensions` i adressefeltet i Chrome.
4. Slå på **Utviklermodus / Developer mode** øverst til høyre.
5. Trykk **Last inn upakket / Load unpacked**.
6. Velg mappen som **direkte inneholder `manifest.json`**. GitHub legger vanligvis filene i en mappe som heter `schibsted-blocker-main`.
7. Last inn Aftenposten på nytt. Banneret skal skjules, og siden skal kunne rulles som normalt.

Fest **Aftenposten Quiet** til verktøylinjen via puslespillikonet i Chrome. Klikk på utvidelsen for å endre innstillinger.

> **«Manifest file is missing or unreadable»?** Du har sannsynligvis valgt mappen ett nivå for høyt. Finn `manifest.json`, og velg akkurat den mappen under **Last inn upakket**. Ikke velg ZIP-filen.

Behold mappen etter installasjonen: Chrome laster utvidelsen derfra.

## Innstillinger

| Innstilling | Hva den gjør |
| --- | --- |
| **Skjul cookiebanner** | Skjuler Sourcepoint-dialogen og fjerner den tilhørende rullelåsen. |
| **Slett kjente sporingscookies automatisk** | Sletter gjenkjente sporingscookies når de opprettes, ved sidebesøk, ved nettleserstart og ved en kontroll hver time. |
| **Nullstill Pulse-identifikatorer hver 24. time** | Sletter `_pulse2data` og `__pulseEnvironmentId` hvis de finnes på Aftenposten-domener. Nettstedet kan opprette nye verdier. |
| **Flere cookienavn som skal beholdes** | Beskytter navnene du skriver inn. Ett nøyaktig cookienavn per linje. |
| **Nullstill sporing nå** | Sletter gjenkjente sporingscookies og eventuelle Pulse-identifikatorer med en gang. Krever at automatisk sletting er aktivert. |
| **Vis originale cookieinnstillinger** | Slår av skjulingen. Last inn Aftenposten på nytt, eller bruk nettstedets egen lenke til cookieinnstillingene hvis du allerede har gjort et valg. |

De tre avkrysningsboksene er på som standard. Trykk **Lagre innstillinger** etter endringer. Skjulingen oppdateres også i åpne Aftenposten-faner.

Cookieoversikten viser navn, domene, sti og klassifisering. Cookieverdier vises aldri.

### Hvilke cookies beholdes?

Kjente innloggings- og samtykkecookies, ytelsescookien `abx2`, ukjente cookies og navn du selv har beskyttet. Blant disse er `id-jwt`, `schacc-session`, `csrfToken`, `nonce`, Sourcepoint-cookies og TCF-samtykkecookies.

Sporingslisten omfatter navnemønstre fra blant annet Google Analytics, Meta og Hotjar. Se [policy.js](policy.js). Beskyttelsen bygger på cookienavn; fremtidige endringer hos nettstedet kan kreve tilpasninger.

## Personvern og begrensninger

- **Skjuling endrer ikke samtykket ditt.** Utvidelsen godtar ikke cookies, trekker ikke tilbake tidligere samtykke og lager ikke falske samtykkeverdier. Endre samtykke i nettstedets egne innstillinger.
- **Sletting stopper ikke all sporing.** Oppryddingen skjer asynkront, så en cookie kan rekke å bli sendt før den slettes. Nettstedet kan opprette cookies på nytt.
- **Tilgangen er begrenset til HTTPS på Aftenposten-domener.** Banneret skjules på `www.aftenposten.no` og `aftenposten.no`; cookieoppryddingen omfatter også underdomener.
- **Delte Schibsted-cookies berøres ikke.** Cookies på `.schibsted.no`, `.schibsted.com` og eksterne annonsedomener ligger utenfor tilgangen.
- **Pulse har flere formål.** Schibsted oppgir også sikkerhet og svindelforebygging. Slå av daglig nullstilling dersom disse funksjonene får problemer. Den publiserte oversikten oppgir Pulse-cookiene på `.schibsted.no`; utvidelsen nullstiller dem bare hvis de også finnes på Aftenposten-domener.
- **Andre lagringsformer berøres ikke.** Lokal lagring, IndexedDB, nettverksforespørsler og kontodata på serveren endres ikke. Utvidelsen gir ikke anonymitet.
- **Abonnement og artikkelbetalingsmurer endres ikke.** Ingen betalte tjenester velges automatisk.

Innstillinger og tidspunkt/resultat for opprydding lagres lokalt. Utvidelsen sender ikke data til utvikleren. Slettede cookieverdier kan ikke gjenopprettes.

## Oppdater eller fjern

**Oppdater:** Last ned og pakk ut den nye versjonen, erstatt filene i installasjonsmappen og trykk på oppdateringsikonet i `chrome://extensions`. Last deretter inn Aftenposten på nytt. Oppdatering skjer ikke automatisk.

**Pause sletting:** Slå av **Slett kjente sporingscookies automatisk** og lagre. Det stopper også manuell og daglig nullstilling.

**Fjern:** Velg **Fjern / Remove** i `chrome://extensions`. Nettstedet fungerer deretter uten utvidelsens endringer. Installasjonsmappen kan slettes etterpå.

## Hvordan banneret fungerer

Aftenpostens side ble undersøkt 1. oktober 2026. Banneret var en Sourcepoint-dialog med en iframe fra `cmp.aftenposten.no`, TCF-samtykkestyring og rullelåsen `sp-message-open` på HTML-elementet.

Observerte kjennetegn:

```text
div#sp_message_container_1489174[role=dialog][aria-modal=true]
iframe#sp_message_iframe_1489174[title="SP Consent Message"]
https://cmp.aftenposten.no/index.html?...consent_origin=.../consent/tcfv2...
html.sp-message-open
https://cmp.aftenposten.no/unified/4.40.3/...
```

Utvidelsen bruker ID-prefiksene fremfor et bestemt meldingsnummer og følger med på dynamiske sideendringer. Den klikker ikke på samtykkeknapper.

Kilder:

- [Aftenpostens forside](https://www.aftenposten.no/)
- [Schibsteds forklaring av cookies og TCF-dialogen](https://schibsted.com/schibsteds-personvern-og-cookieerklaering/bruk-av-informasjonskapsler-cookies-piksler-og-annen-teknologi/)
- [Cookieoversikt for Aftenposten](https://cookies.privacy.schibsted.com/reports/norway/aftenposten/cookies.html), generert 3. september 2026. Oversikten er ikke en uttømmende undersøkelse av alle nettlesere og samtykkevalg.
- [Chromes cookies-API](https://developer.chrome.com/docs/extensions/reference/api/cookies)
- [Chromes alarms-API](https://developer.chrome.com/docs/extensions/reference/api/alarms)
- [Chromes installasjonsveiledning](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked)

## Utvikling og testing

Ingen npm-pakker må installeres. Med Node.js tilgjengelig:

```sh
npm test
```

Testene dekker domeneavgrensning, bevaring av innlogging og samtykke, partisjonerte cookies, daglig nullstilling, avslått opprydding, personvern i oversikten, skjuling/gjenoppretting av banneret og gjentatte sideendringer. Chrome-API-ene og bannerstrukturen testes med isolerte testdata.

Automatiske tester har bestått. Hele installasjonsflyten er ikke verifisert i en vanlig Chrome-profil. Kontroller etter installasjon at banneret forsvinner, at siden kan rulles og at du fortsatt er innlogget. Nettstedets struktur og cookienavn kan endre seg.

Prosjektet er uavhengig og er ikke tilknyttet Aftenposten eller Schibsted.

