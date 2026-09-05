export const validateField = (name, value) => {
    if (name === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) ? '' : 'Enter a valid email address.';
    }

    if (name === 'username') {
        return value.length >= 3 ? '' : 'Username must be at least 3 characters.';
    }

    if (name === 'password') {
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
        return passwordRegex.test(value)
            ? ''
            : 'Use 8 or more characters with at least one letter and one number.';
    }

    return '';
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
