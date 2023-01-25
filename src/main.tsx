// Consider that for a private page to be compiled into html you would need to
// use the notion api and an integration token to query it. This is not the case
// for public pages where you only need to make an http request to the url of the
// exposed page.

// First I gonna start with the private page because that's what i'm currently working
// with.
async function notionPageToHtml(pageId: string): Promise<string> {}
