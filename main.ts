import { serve } from "https://deno.land/std@0.159.0/http/server.ts";
import { DOMParser, Element } from "https://deno.land/x/deno_dom@v0.1.36-alpha/deno-dom-wasm.ts";

type SiteData = {
  title: string
  description?: string
  content?: string
  urls: string[]
  metadata: Record<string, string>
}

const crawl = async (url: string) => {
  try {
    const res = await fetch(url);
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    const title = doc?.querySelector('title')?.innerText;
    const description = doc?.querySelector('meta[name=description]')?.getAttribute('content');

    const contents: string[] = []
    // loop through all text node
    doc?.querySelectorAll('h1, h2, h3, h4, h5, p, span, li').forEach(item => {
      contents.push(cleanString(item.textContent));
    })

    const content = contents.join('\\n');

    // store only unique url using Set
    const urlSets = new Set<string>()
    // loop through all a
    doc?.querySelectorAll('a').forEach(item => {
      const link = (item as Element).getAttribute('href');
      if (link) {
        urlSets.add(link);
      }
    })
    const urls = Array.from(urlSets);


    const metadata: Record<string, string> = {}
    // loop through all a
    doc?.querySelectorAll('meta').forEach(item => {
      const el = (item as Element)
      const name = el.getAttribute('name');
      const content = el.getAttribute('content');
      if (name && content) {
        metadata[name] = content
      }
    })

    return { title, description, content, urls, metadata } as SiteData
  } catch (error) {
    console.log(error);
  }
}

const cleanString = (value: string) => {
  // replace line break to space
  let str = value.replace(/[\r\n|\n|\t]/gm, " ");
  // remove double spaces
  str = str.replace(/ +(?= )/g, "");
  // remove space start
  str = str.replace(/^ /, "");
  // remove space end
  str = str.replace(/ $/, "");
  return str;
}


const port = 8080;

const handler = async (request: Request) => {
  if (request.method === 'POST') {
    const reqData = await request.json();
    // console.log(data)
    const siteData = await crawl(reqData.url)
    return Response.json(siteData)
  }

  return new Response('hello');
};

console.log(`HTTP webserver running. Access it at: http://localhost:8080/`);
await serve(handler, { port });