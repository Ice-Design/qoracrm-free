import React, { useState, useEffect } from 'react';

const ExtensionSlot = ({ name, fallback = null, ...props }) => {
    const [Component, setComponent] = useState(() => window.QoraCRM?.getExtension(name));

    useEffect(() => {
        const handleExtensionRegistered = (e) => {
            if (e.detail.name === name) {
                setComponent(() => e.detail.component);
            }
        };

        // Listen for new extensions being registered
        window.addEventListener('qoracrm:extension_registered', handleExtensionRegistered);

        // Initial check in case it was registered before the event listener was added
        const ext = window.QoraCRM?.getExtension(name);
        if (ext) {
            setComponent(() => ext);
        }

        return () => {
            window.removeEventListener('qoracrm:extension_registered', handleExtensionRegistered);
        };
    }, [name]);

    if (Component) {
        return <Component {...props} />;
    }

    return fallback;
};

export default ExtensionSlot;
