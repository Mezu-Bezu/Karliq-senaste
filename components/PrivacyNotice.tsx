import { email, type Locale } from "../lib/site";

const notices = {
  sv: {
    title: "Integritet och kakor",
    description: "Så hanterar Karliq personuppgifter när du besöker webbplatsen eller hör av dig.",
    controllerTitle: "Vem ansvarar för uppgifterna?",
    controller: "Erik Karlsson driver Karliq i Jönköpings län och är personuppgiftsansvarig för behandlingen som beskrivs här. Du når honom på",
    visitTitle: "När du besöker sajten",
    visit: "Cloudflare tar emot tekniska uppgifter som din IP-adress och vilken sida du öppnar för att leverera och skydda webbplatsen. Karliq använder landskoden från Cloudflare för att välja svenska eller engelska när du öppnar karliq.se. Du kan byta språk via menyn.",
    visitBasis: "Den rättsliga grunden är Karliqs berättigade intresse av att hålla webbplatsen tillgänglig och säker och visa den på ett språk som passar besökaren.",
    motion: "När du lutar mobilen för att styra grafiken används rörelsedatan lokalt i webbläsaren.",
    mailTitle: "När du mejlar",
    mail: "Karliq använder din e-postadress, det namn du uppger och det du skriver för att kunna svara och följa upp din förfrågan. Den rättsliga grunden är Karliqs berättigade intresse av att hantera inkommande ärenden. Om du själv vill ingå avtal kan dina uppgifter också behövas för att förbereda avtalet på din begäran.",
    retention: "Mejl sparas så länge de behövs för att hantera ärendet. Om det blir ett uppdrag kan vissa uppgifter sparas längre för att fullgöra avtalet, följa bokföringsregler eller hantera rättsliga anspråk.",
    providersTitle: "Drift och leverantörer",
    providers: "Cloudflare driver webbplatsen och förmedlar mejl till Karliqs e-posttjänst. Tekniska uppgifter kan finnas i Cloudflares drift- och säkerhetsloggar så länge de behövs för att felsöka eller utreda en incident.",
    transfers: "Cloudflare kan behandla uppgifter utanför EU/EES. Skyddet för sådana överföringar beskrivs i Cloudflares personuppgiftsbiträdesavtal, som bland annat använder EU-kommissionens standardavtalsklausuler. Mejla Karliq om du vill ha mer information eller en kopia av skyddsåtgärderna.",
    dpa: "Cloudflares personuppgiftsbiträdesavtal",
    cookieTitle: "Kakor och språkval",
    cookies: "Språkvalet följer sidans adress. Karliq använder inga kakor för språkval, besöksstatistik eller marknadsföring. Cloudflare kan använda nödvändiga säkerhetskakor när webbplatsen behöver kontrollera en förfrågan.",
    cookieDetails: "Cloudflares säkerhetskakor och lagringstider",
    rightsTitle: "Dina rättigheter",
    rights: "Du kan be om tillgång till dina uppgifter och få fel rättade. I vissa fall kan du begära radering, begränsning eller att få ut uppgifter för att flytta dem. Du kan invända mot behandling som bygger på berättigat intresse. Kontakta Karliq via e-post för att använda dina rättigheter.",
    complaint: "Lämna klagomål till Integritetsskyddsmyndigheten (IMY)",
  },
  en: {
    title: "Privacy and cookies",
    description: "How Karliq handles personal data when you visit the site or get in touch.",
    controllerTitle: "Who is responsible for your data?",
    controller: "Erik Karlsson runs Karliq in Jönköping County, Sweden, and is the data controller for the processing described here. You can reach him at",
    visitTitle: "When you visit the site",
    visit: "Cloudflare receives technical information such as your IP address and the page you open so it can deliver and protect the website. Karliq uses Cloudflare’s country code to choose Swedish or English when you open karliq.se. You can change the language in the menu.",
    visitBasis: "The legal basis is Karliq’s legitimate interest in keeping the site available and secure and displaying it in a language that suits the visitor.",
    motion: "When you tilt your phone to move the graphics, motion data is used locally in your browser.",
    mailTitle: "When you email Karliq",
    mail: "Karliq uses your email address, any name you provide and your message to reply and follow up. The legal basis is Karliq’s legitimate interest in handling enquiries. If you want to enter into a contract yourself, your data may also be needed to take steps at your request before entering into it.",
    retention: "Emails are kept for as long as needed to handle the enquiry. If it leads to a project, some data may be kept longer to perform the contract, comply with accounting rules or deal with legal claims.",
    providersTitle: "Hosting and service providers",
    providers: "Cloudflare hosts the website and routes messages to Karliq’s email service. Technical information may be held in Cloudflare’s operational and security logs for as long as it is needed to troubleshoot or investigate an incident.",
    transfers: "Cloudflare may process data outside the EU/EEA. Its Data Processing Addendum describes safeguards for those transfers, including the European Commission’s standard contractual clauses. Email Karliq for more information or a copy of the safeguards.",
    dpa: "Cloudflare’s Data Processing Addendum",
    cookieTitle: "Cookies and language",
    cookies: "Your language is part of the page address. Karliq does not use cookies for language, visitor analytics or marketing. Cloudflare may use essential security cookies when the website needs to verify a request.",
    cookieDetails: "Cloudflare’s security cookies and their duration",
    rightsTitle: "Your rights",
    rights: "You can ask for access to your data and have errors corrected. In some cases, you can ask for deletion, restriction or a copy of your data in a portable format. You can object to processing based on legitimate interests. Email Karliq to exercise your rights.",
    complaint: "Complain to the Swedish Authority for Privacy Protection (IMY)",
  },
};

export function privacyMetadata(locale: Locale) {
  const { title, description } = notices[locale];
  return { title, description };
}

export default function PrivacyNotice({ locale }: { locale: Locale }) {
  const text = notices[locale];
  const complaintUrl = locale === "sv"
    ? "https://www.imy.se/privatperson/utfora-arenden/lamna-ett-klagomal/"
    : "https://e-tjanster.imy.se/en/klagomal";

  return (
    <>
      <section aria-labelledby="privacy-controller">
        <h2 id="privacy-controller">{text.controllerTitle}</h2>
        <p>{text.controller} <a href={`mailto:${email}`}>{email}</a>.</p>
      </section>
      <section aria-labelledby="privacy-visit">
        <h2 id="privacy-visit">{text.visitTitle}</h2>
        <p>{text.visit}</p>
        <p>{text.visitBasis}</p>
        <p>{text.motion}</p>
      </section>
      <section aria-labelledby="privacy-email">
        <h2 id="privacy-email">{text.mailTitle}</h2>
        <p>{text.mail}</p>
        <p>{text.retention}</p>
      </section>
      <section aria-labelledby="privacy-providers">
        <h2 id="privacy-providers">{text.providersTitle}</h2>
        <p>{text.providers}</p>
        <p>{text.transfers}</p>
        <a href="https://www.cloudflare.com/cloudflare-customer-scc/">{text.dpa}</a>
      </section>
      <section aria-labelledby="privacy-cookies">
        <h2 id="privacy-cookies">{text.cookieTitle}</h2>
        <p>{text.cookies}</p>
        <a href="https://developers.cloudflare.com/fundamentals/reference/policies-compliances/cloudflare-cookies/">
          {text.cookieDetails}
        </a>
      </section>
      <section aria-labelledby="privacy-rights">
        <h2 id="privacy-rights">{text.rightsTitle}</h2>
        <p>{text.rights}</p>
        <a href={complaintUrl}>{text.complaint}</a>
      </section>
    </>
  );
}
