import { Icon } from "@iconify/react/dist/iconify.js";
import { Link, useNavigate } from "react-router-dom";

import classes from "./ErrorElement.module.sass";

export default function ErrorElement() {
    const navigate = useNavigate();

    return (
        <div className={classes.error__container}>
            <Icon 
                icon="fluent-emoji-high-contrast:disappointed-face" 
                width="100px" 
                height="100px" 
                aria-label="Disappointed face icon"
            />
            <h1 className={classes.error__code}>404</h1>
            <p className={classes.notFound__text}>Page not found</p>
            <div className={classes.explanations__container}>
                <p>The page you are looking for doesn't exist or another error occurred.</p>
                <p>
                    <strong>Go back</strong> or head over to{" "}
                    <Link to="/" className={classes.home__link}>
                        bb-chat-five.vercel.app
                    </Link>{" "}
                    to choose a new direction.
                </p>
            </div>
            <button 
                onClick={() => navigate("/")} 
                className={classes.home__button}
                aria-label="Take me home"
            >
                Take me home
            </button>
        </div>
    );
}
