import UserInfo from './UserInfo'
import profileImage from '../../images/no-profile-picture.png'
import classes from './EditProfile.module.sass'

export default function EditProfile() {

    return <div className={classes.edit__profile}>
        <div className={classes.profile__image}>
            <img src={profileImage} alt='Profile image' />
        </div>
        <p className={classes.nickname}>@saleha_123</p>
        <div className={classes.user__info}>
            <UserInfo info='Username' userInfo='Saleha Jamsed' />
            <UserInfo info='Email' userInfo='saleha@gmail.com' />
            <UserInfo info='Address' userInfo='New York, USA' />
            <UserInfo info='Nickname' userInfo='Sky Angel' />
            <UserInfo info='DOB' userInfo='Aprill 28, 1981' />
        </div>
        
        <button>Save</button>
    </div>
};
