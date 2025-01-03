import { Icon } from "@iconify/react/dist/iconify.js";
import classes from './UserInfo.module.sass';
import { useState, useEffect } from "react";

export default function UserInfo({ info, userInfo, onSave }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedValue, setEditedValue] = useState(userInfo || '');

    useEffect(() => {
        setEditedValue(userInfo || '');
    }, [userInfo]);

    const handleSave = () => {
        if (typeof onSave === 'function') {
            onSave(editedValue);
        } else {
            console.error('onSave is not a function.');
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedValue(userInfo || '');
        setIsEditing(false);
    };

    const inputType = info === 'DOB' ? 'date' : 'text';

    return (
        <ul className={classes.list__info}>
            <li className={classes.li__info}>{info}</li>

            {isEditing ? (
                <div className={classes.edit__container}>
                    <input
                        type={inputType}
                        value={editedValue || ''}
                        onChange={(e) => setEditedValue(e.target.value)}
                        className={classes.edit__input}
                        placeholder={`Enter ${info.toLowerCase()}`}
                    />
                    <li className={classes.inputs__icons}>
                        <Icon
                            icon="icon-park-solid:correct"
                            style={{ color: 'green', cursor: 'pointer' }}
                            onClick={handleSave}
                        />
                        <Icon
                            icon="mdi:cancel"
                            style={{ color: 'red', marginLeft: '0.5rem', cursor: 'pointer' }}
                            onClick={handleCancel}
                        />
                    </li>
                </div>
            ) : (
                <li className={classes.li__info}>{editedValue || `No ${info}`}</li>
            )}

            {!isEditing && (
                <li className={classes.icon__edit}>
                    <Icon
                        onClick={() => setIsEditing(true)}
                        icon="mdi:pencil"
                        style={{ color: '#ADADAD', cursor: 'pointer' }}
                    />
                </li>
            )}
        </ul>
    );
}
