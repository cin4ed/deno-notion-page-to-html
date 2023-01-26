import { Client, BlockObjectResponse } from "../deps.ts";
// Consider that for a private page to be compiled into html you would need to
// use the notion api and an integration token to query it. This is not the case
// for public pages where you only need to make an http request to the url of the
// exposed page.

// First I gonna start with the private page because that's what i'm currently working
// with.
async function notionPageToHtml(
  pageId: string,
  notion: Client
): Promise<string> {
  const children = await notion.blocks.children.list({ block_id: pageId });

  // TODO: decide whether to include head tag or not
  let html = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <head>
    <body>
  `;

  children.results.forEach((partialBlock) => {
    const block = partialBlock as BlockObjectResponse;
    const blockType = block.type;
    const htmlTag = getHtmlTag(blockType);
  });

  html += "</body>";
  html += "</html>";

  return Promise.resolve(html);
}

// function to get the corresponding html tag for every block.type
function getHtmlTag(blockType: string): string {
  switch (blockType) {
    case "paragraph":
      return "p";
    case "heading_1":
      return "h1";
    case "heading_2":
      return "h2";
    case "heading_3":
      return "h3";
    case "bulleted_list_item":
      return "li";
    case "numbered_list_item":
      return "li";
    case "to_do":
      return "li";
    case "toggle":
      return "li";
    case "quote":
      return "p";
    case "code":
      return "p";
    case "equation":
      return "p";
    case "divider":
      return "hr";
    case "callout":
      return "p";
    case "image":
      return "img";
    case "video":
      return "video";
    case "embed":
      return "unsupported";
    // return "iframe";
    case "pdf":
      return "unsupported";
    // return "iframe";
    case "bookmark":
      return "unsupported";
    // return "a";
    case "table_of_contents":
      return "unsupported";
    // return "p";
    case "breadcrumb":
      return "unsupported";
    // return "p";
    case "page":
      return "unsupported";
    // return "li";
    case "child_page":
      return "unsupported";
    // return "li";
    default:
      return "unsupported";
  }
}
