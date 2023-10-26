import { Toast, ToastProvider } from '@leafygreen-ui/toast';
import { useEffect, useState } from 'react';

export default function(){
    const [toastOpen, setToastOpen] = useState(true);
    return (
    <ToastProvider><Toast
        variant="success"
        title="This is a title"
        body="This is a description"
        open={toastOpen}
        close={() => setToastOpen(false)}
    ></Toast></ToastProvider>
    );
}