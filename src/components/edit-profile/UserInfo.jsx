import { Icon } from "@iconify/react/dist/iconify.js"

import classes from './UserInfo.module.sass'

export default function UserInfo({ info, userInfo }) {
    return <ul className={classes.list__info}>
        <li>{info}</li>
        <li>{userInfo}</li>
        <li><Icon icon="mdi:pencil" style={{ color: '#ADADAD' }} /></li>
    </ul>
};
