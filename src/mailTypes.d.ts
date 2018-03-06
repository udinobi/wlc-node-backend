declare module "mailTypes" {
    interface EMail {
        from: string;
        to: string;
        subject: string;
    }

    interface HtmlMail extends EMail {
        html: string;
    }

    interface TextMail extends EMail {
        text: string;
    }
}
