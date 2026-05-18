import { Plugin } from 'obsidian';
import emojiRegex from 'emoji-regex';

export default class PDFEmoji extends Plugin {
    async onload() {
        console.log('Loading PDF Emoji plugin!'); 

        this.registerMarkdownPostProcessor((element: HTMLElement) => {
            // Create a TreeWalker to visit all text nodes
            const walker = document.createTreeWalker(
                element,
                NodeFilter.SHOW_TEXT,
                null
            );

            const nodesToReplace: { node: Node; newNodes: Node[] }[] = [];
            const regex = emojiRegex();

            let node: Node | null;
            while ((node = walker.nextNode())) {
              
                const parentElement = node.parentElement;
                if (parentElement && parentElement.closest("pre, code, .cm-content")) {
                    continue;
                }

                if (node.nodeValue) {
                    regex.lastIndex = 0;
                    if (regex.test(node.nodeValue)) {
                        const text = node.nodeValue;
                        const newNodes: Node[] = [];
                        let lastIndex = 0;
                        let match;

                        regex.lastIndex = 0;
                        while ((match = regex.exec(text)) !== null) {
                            const emoji = match[0];
                            const matchIndex = match.index;

                            if (matchIndex > lastIndex) {
                                newNodes.push(document.createTextNode(text.slice(lastIndex, matchIndex)));
                            }

                            const isPlainChar = /^[0-9#*]$/.test(emoji);

                            if (!isPlainChar) {
                                const span = document.createElement("span");
                                span.className = "emoji";
                                span.style.setProperty('font-weight', 'normal', 'important');
                                span.style.setProperty('font-style', 'normal', 'important');
                                span.textContent = emoji;
                                newNodes.push(span);
                            } else {
                                newNodes.push(document.createTextNode(emoji)); 
                            }

                            lastIndex = matchIndex + emoji.length;
                        }

                        if (lastIndex < text.length) {
                            newNodes.push(document.createTextNode(text.slice(lastIndex)));
                        }

                        nodesToReplace.push({ node, newNodes });
                    }
                }
            }

            nodesToReplace.forEach(({ node, newNodes }) => {
                const parent = node.parentNode;
                if (parent) {
                    newNodes.forEach(newNode => parent.insertBefore(newNode, node));
                    parent.removeChild(node);
                }
            });

            // Protect leading numbers in headings (e.g. "1. " or "1.2. ") from disappearing in PDF export.
            // element itself may be the heading (Obsidian calls the post-processor with the block element
            // directly), so we include it alongside any heading descendants.
            const headingElements = [element, ...Array.from(element.querySelectorAll('h1, h2, h3, h4, h5, h6'))]
                .filter(el => /^H[1-6]$/.test(el.tagName));

            headingElements.forEach((heading) => {
                const textWalker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT, null);
                const firstTextNode = textWalker.nextNode() as Text | null;
                if (!firstTextNode || !firstTextNode.nodeValue) return;
                const match = firstTextNode.nodeValue.match(/^(\d+(?:\.\d+)*\.\s*)/);
                if (!match) return;
                const numStr = match[1];
                const rest = firstTextNode.nodeValue.slice(numStr.length);
                const numSpan = document.createElement('span');
                numSpan.style.setProperty('display', 'inline', 'important');
                numSpan.style.setProperty('visibility', 'visible', 'important');
                numSpan.style.setProperty('opacity', '1', 'important');
                numSpan.textContent = numStr;
                const parent = firstTextNode.parentNode!;
                parent.insertBefore(numSpan, firstTextNode);
                if (rest) parent.insertBefore(document.createTextNode(rest), firstTextNode);
                parent.removeChild(firstTextNode);
            });
        });
    }

    onunload() {
        console.log('Unloading PDF Emoji plugin!');
    }
}
