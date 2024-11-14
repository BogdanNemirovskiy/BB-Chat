import { Icon } from "@iconify/react/dist/iconify.js";

export const validateField = (name, value) => {
    let error = '';

    if (name === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            error = <Icon icon='icon-park-solid:error' style={{ color: "#ff0000" }} />;
        }
    } else if (name === 'username') {
        if (value.length < 3) {
            error = <Icon icon='icon-park-solid:error' style={{ color: "#ff0000" }} />;
        }
    } else if (name === 'password') {
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{5,}$/;
        if (!passwordRegex.test(value)) {
            error = <Icon icon='icon-park-solid:error' style={{ color: "#ff0000" }} />;
        }
    }

    return error;
};

export const validateAllFields = (formData) => {
    const errors = {};

    Object.keys(formData).forEach((field) => {
        const error = validateField(field, formData[field]);
        if (error) {
            errors[field] = error;
        }
    });

    return errors;
};
