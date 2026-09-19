import { Link } from 'react-router-dom';
import logo from '../../images/logo.png';
import classes from './Auth.module.sass';

export default function AuthShell({ title, subtitle, children, footer }) {
    return (
        <div className={classes.page}>
            <div className={classes.brand}>
                <img src={logo} alt="" />
                <span>BB Chat</span>
            </div>

            <div className={classes.card}>
                <h1 className={classes.card__title}>{title}</h1>
                <p className={classes.card__subtitle}>{subtitle}</p>
                {children}
            </div>

            <p className={classes.footer}>{footer}</p>

            {/* BS: shown on both auth screens rather than on sign-up alone —
                the notice has to be reachable before an email is handed over,
                whichever door the visitor came through. */}
            <p className={classes.legal}>
                We store your email, name and messages to run the chat.{' '}
                <Link to="/privacy">Privacy Policy</Link>
            </p>
        </div>
    );
}
