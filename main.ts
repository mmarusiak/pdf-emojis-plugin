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
        });
    }

    onunload() {
        console.log('Unloading PDF Emoji plugin!');
    }
}
