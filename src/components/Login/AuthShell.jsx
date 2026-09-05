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
        </div>
    );
}
