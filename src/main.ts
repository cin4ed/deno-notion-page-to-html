import { Client, BlockObjectResponse, RichTextItemResponse } from "../deps.ts";
// Consider that for a private page to be compiled into html you would need to
// use the notion api and an integration token to query it. This is not the case
// for public pages where you only need to make an http request to the url of the
// exposed page.

// First I gonna start with the private page because that's what i'm currently working
// with.
export async function notionPageToHtml(
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

  // this is for list handling
  let previousWasBulletedListItem = false;
  let previousWasNumberedListItem = false;
  let previousWasToggleListItem = false;
  let previousWasTodoListItem = false;

  children.results.forEach((partialBlock) => {
    const block = partialBlock as BlockObjectResponse;
    const blockType = block.type;
    const htmlTag = getHtmlTag(blockType);

    if (htmlTag === "unsupported") {
      return;
    }

    if (blockType !== "bulleted_list_item" && previousWasBulletedListItem) {
      html += "</ul>";
      previousWasBulletedListItem = false;
    }

    if (blockType !== "numbered_list_item" && previousWasNumberedListItem) {
      html += "</ol>";
      previousWasNumberedListItem = false;
    }

    if (blockType !== "to_do" && previousWasTodoListItem) {
      html += "</div>";
      // html += "</ul>";
      previousWasTodoListItem = false;
    }

    if (blockType !== "toggle" && previousWasToggleListItem) {
      html += "</ol>";
      previousWasToggleListItem = false;
    }

    if (blockType === "bulleted_list_item" && !previousWasBulletedListItem) {
      html += "<ul>";
      previousWasBulletedListItem = true;
    }

    if (blockType === "numbered_list_item" && !previousWasNumberedListItem) {
      html += "<ol>";
      previousWasNumberedListItem = true;
    }

    if (blockType === "toggle" && !previousWasToggleListItem) {
      html += "<ol class='toggle-list'>";
      previousWasToggleListItem = true;
    }

    if (blockType === "to_do" && !previousWasTodoListItem) {
      html += '<div class="todo-list-container">';
      previousWasTodoListItem = true;
    }

    if (blockType === "equation") {
      html += `<div class="equation">${block.equation?.expression}</div>`;
      return;
    }

    if (blockType === "image") {
      if (block.image?.type === "file") {
        html += `<img src="${block.image?.file?.url}" alt="${block.image?.caption?.[0]?.plain_text}">`;
      } else if (block.image?.type === "external") {
        html += `<img src="${block.image?.external?.url}" alt="${block.image?.caption?.[0]?.plain_text}">`;
      }
      return;
    }

    if (blockType === "video") {
      if (block.video?.type === "file") {
        html += `<video src="${block.video?.file?.url}" controls></video>`;
      } else if (block.video?.type === "external") {
        html += `<video src="${block.video?.external?.url}" controls></video>`;
      }
      return;
    }

    if (blockType === "divider") {
      html += "<hr>";
      return;
    }

    if (blockType === "paragraph") {
      html += reduceRichText(block.paragraph.rich_text || []);
    } else if (blockType === "heading_1") {
      html += reduceRichText(block.heading_1.rich_text || []);
    } else if (blockType === "heading_2") {
      html += reduceRichText(block.heading_2.rich_text || []);
    } else if (blockType === "heading_3") {
      html += reduceRichText(block.heading_3.rich_text || []);
    } else if (blockType === "quote") {
      html += reduceRichText(block.quote.rich_text);
    } else if (blockType === "callout") {
      html += reduceRichText(block.callout.rich_text);
    } else if (blockType === "code") {
      html += reduceRichText(block.code.rich_text, true);
    } else if (blockType === "bulleted_list_item") {
      html += reduceRichText(block.bulleted_list_item.rich_text);
    } else if (blockType === "numbered_list_item") {
      html += reduceRichText(block.numbered_list_item.rich_text);
    } else if (blockType === "toggle") {
      html += reduceRichText(block.toggle.rich_text);
    } else if (blockType === "to_do") {
      html += reduceRichText(block.to_do.rich_text);
      html += "</div>";
    }

    // This are unsupported block types
    // } else if (blockType === "table_of_contents") {
    //   html += reduceRichText(block.table_of_contents?.rich_text);
    // } else if (blockType === "column_list") {
    //   html += reduceRichText(block.column_list?.rich_text);
    // } else if (blockType === "column") {
    //   html += reduceRichText(block.column?.rich_text);
    // } else if (blockType === "breadcrumb") {
    //   html += reduceRichText(block.breadcrumb?.rich_text);
    // } else if (blockType === "fact") {
    //   html += reduceRichText(block.fact?.rich_text);
    // } else if (blockType === "page") {
    //   html += reduceRichText(block.page?.rich_text);
    // } else if (blockType === "collection_view") {
    //   html += reduceRichText(block.collection_view?.rich_text);
    // } else if (blockType === "collection_view_page") {
    //   html += reduceRichText(block.collection_view_page?.rich_text);
    // }

  });

  html += "</body>";
  html += "</html>";

  return Promise.resolve(html);
}

function reduceRichText(
  richText: RichTextItemResponse[],
  isCode = false
): string {
  return richText.reduce((acc: string, curr: RichTextItemResponse): string => {
    if (curr.type === "equation") acc += '<span class="inline-equation">';
    if (curr.annotations.bold) acc += "<b>";
    if (curr.annotations.italic) acc += "<i>";
    if (curr.annotations.underline) acc += "<u>";
    if (curr.annotations.strikethrough) acc += "<s>";
    acc += isCode ? curr.plain_text.replaceAll("\n", "<br>") : curr.plain_text;
    if (curr.annotations.strikethrough) acc += "</s>";
    if (curr.annotations.underline) acc += "</u>";
    if (curr.annotations.italic) acc += "</i>";
    if (curr.annotations.bold) acc += "</b>";
    if (curr.type === "equation") acc += "</span>";
    return acc;
  }, "");
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
