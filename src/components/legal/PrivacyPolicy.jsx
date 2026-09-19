import { Link, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react/dist/iconify.js";

import classes from "./PrivacyPolicy.module.sass";

// BS: Kept as plain JSX rather than a CMS/markdown pipeline — the notice has to
// stay accurate against the code next to it, so it lives in the repo and changes
// in the same commit as whatever processing it describes.
const LAST_UPDATED = "19 September 2026";
const CONTACT_EMAIL = "nem.bogdan2006@gmail.com";

export default function PrivacyPolicy() {
    const navigate = useNavigate();

    return (
        <div className={classes.page}>
            <div
                className={classes.go_back}
                onClick={() => navigate(-1)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") navigate(-1);
                }}
            >
                <Icon icon="weui:arrow-filled" />Go back
            </div>

            <article className={classes.paper}>
                <header className={classes.head}>
                    <h1>Privacy Policy</h1>
                    <p className={classes.updated}>Last updated: {LAST_UPDATED}</p>
                </header>

                <section>
                    <p className={classes.intro}>
                        BB Chat is a personal portfolio project — a real, working chat app rather
                        than a commercial service. It is still a real service holding real data
                        about real people, so this page explains exactly what is collected, why,
                        who it reaches and how to get rid of it.
                    </p>
                </section>

                <section>
                    <h2>Who is responsible</h2>
                    <p>
                        Bogdan Nemirovskiy is the data controller for this project. For anything
                        on this page — including a request to see or delete your data — write to{" "}
                        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
                    </p>
                </section>

                <section>
                    <h2>What is collected, and why</h2>
                    <table className={classes.table}>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Why it is needed</th>
                                <th>Legal basis</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Email address</td>
                                <td>Identifies your account and lets you reset your password.</td>
                                <td>Contract</td>
                            </tr>
                            <tr>
                                <td>Display name, user tag, avatar</td>
                                <td>Shown to the people you chat with.</td>
                                <td>Contract</td>
                            </tr>
                            <tr>
                                <td>Messages you send</td>
                                <td>They are the service — delivered to the chat's participants.</td>
                                <td>Contract</td>
                            </tr>
                            <tr>
                                <td>Reports you file about another user</td>
                                <td>Lets abuse be reviewed and acted on.</td>
                                <td>Legitimate interests</td>
                            </tr>
                        </tbody>
                    </table>
                    <p>
                        Nothing else is collected. There is no profiling, no advertising, no
                        automated decision-making, and your data is never sold or shared for
                        marketing.
                    </p>
                </section>

                <section>
                    <h2>Cookies and tracking</h2>
                    <p>
                        <strong>This site has no analytics and no tracking cookies</strong>, which
                        is why you are not being asked to accept any. The only thing stored in your
                        browser is the sign-in session Firebase Authentication needs to keep you
                        logged in. That is strictly necessary for a service you asked to use, so it
                        requires no consent — and signing out clears it.
                    </p>
                    <p>
                        The Inter typeface is served from this site rather than from Google Fonts,
                        so simply opening a page does not hand your IP address to a third party.
                    </p>
                </section>

                <section>
                    <h2>Who else processes your data</h2>
                    <p>
                        These providers process data on this project's behalf, under their own
                        terms. Each is in or transfers to the United States:
                    </p>
                    <ul className={classes.list}>
                        <li>
                            <strong>Google Firebase</strong> — authentication and the Firestore
                            database holding profiles, chats and messages.
                        </li>
                        <li>
                            <strong>Cloudinary</strong> — stores profile pictures you upload.
                        </li>
                        <li>
                            <strong>Vercel</strong> — hosts the site and processes the connection
                            data (including IP address) any web server sees.
                        </li>
                        <li>
                            <strong>Iconify</strong> and <strong>jsDelivr</strong> — serve the
                            interface icons and the emoji images. Your browser requests those
                            directly, so they see your IP address, but they are never told who you
                            are.
                        </li>
                    </ul>
                </section>

                <section>
                    <h2>How long it is kept</h2>
                    <p>
                        Your account data and messages are kept for as long as your account exists.
                        Delete your account and the profile, email address and avatar go with it,
                        immediately and permanently.
                    </p>
                    <p>
                        Messages you already sent are <em>not</em> deleted — they are anonymised, so
                        they stay readable for the person you were talking to but are no longer
                        linked to you or your name. Reports are kept for up to 12 months so repeated
                        abuse can be recognised.
                    </p>
                    <p>
                        The shared <strong>demo account</strong> is public: anyone can sign into it,
                        and everything posted there is visible to every other visitor. Its
                        conversation is wiped periodically. Do not put anything personal in it.
                    </p>
                </section>

                <section>
                    <h2>Your rights</h2>
                    <p>
                        Under the GDPR you can ask for access to your data, correction of it,
                        erasure, a portable copy, restriction of processing, or object to it. Two of
                        these you can exercise yourself, right now, without asking anyone:
                    </p>
                    <ul className={classes.list}>
                        <li>
                            <strong>Correction</strong> — edit your name, tag and picture on your{" "}
                            <Link to="/edit-profile">profile page</Link>.
                        </li>
                        <li>
                            <strong>Erasure</strong> — <em>Delete account</em> at the bottom of the
                            same page does it in one step.
                        </li>
                    </ul>
                    <p>
                        For the rest, email{" "}
                        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and you will get a
                        reply within one month. If you believe your data has been mishandled you can
                        also complain to your national data protection authority.
                    </p>
                </section>

                <section>
                    <h2>Security</h2>
                    <p>
                        Traffic is encrypted in transit. Database access is restricted by Firestore
                        security rules, so only the participants of a conversation can read it and
                        only you can write to your own profile. Passwords are handled by Firebase
                        Authentication and are never visible to this project.
                    </p>
                </section>

                <section>
                    <h2>Changes</h2>
                    <p>
                        If what the app does with data changes, this page changes with it and the
                        date at the top is updated.
                    </p>
                </section>
            </article>
        </div>
    );
}
