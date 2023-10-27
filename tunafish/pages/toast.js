import { Toast, ToastProvider } from '@leafygreen-ui/toast';
import { useEffect, useState } from 'react';
import Button from '@leafygreen-ui/button';

export default function(){
    const [toastOpen, setToastOpen] = useState(true);
    const [progressOpen, setProgressOpen] = useState(true);
    const [open, setOpen] = useState(false);
    const [openAnother, setOpenAnother] = useState(false);

    const setToastsTrue = () => {
        setOpen(true);
        setOpenAnother(true);
    }

    return (
            <ToastProvider>
                <Button onClick={() => setToastsTrue()}>
                Open All
              </Button>
              <Button onClick={() => {setOpen(!open)}}>
                {open ? 'Close' : 'Open'} Toast
              </Button>
              <Button onClick={() => {setOpenAnother(!openAnother)}}>
                {openAnother ? 'Close' : 'Open'} Another Toast
              </Button>
              <>
                <Toast
                    variant="success"
                    title="This is a title"
                    body="This is a description"
                    open={open}
                    onClose={() => {
                    setOpen(false);
                    }}
                />
                <Toast
                    variant="success"
                    title="Another toast"
                    body="Toasty!"
                    open={openAnother}
                    onClose={() => {
                    setOpenAnother(false);
                    }}
                />
                </>
            </ToastProvider>
    // <ToastProvider>
    //     <Toast
    //         variant="success"
    //         title="This is a title"
    //         body="This is a description"
    //         open={toastOpen}
    //         onClose={() => setToastOpen(false)}
    //     />
    //     <Toast
    //         variant="progress"
    //         title="Another toast"
    //         body="Progressing toast"
    //         open={progressOpen}
    //         onClose={() => setProgressOpen(false)}
    //     />
    // </ToastProvider>
    );
}