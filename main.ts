import {
    App,
    Plugin,
    PluginSettingTab,
    Setting,
    Notice,
    ItemView,
} from 'obsidian';

/**
 * Interface for plugin settings.
 */
interface CanvasChatPluginSettings {
    vllmApiUrl: string;           // URL of the vLLM API server
    userHighlightColor: string;   // Highlight color for user messages
    assistantHighlightColor: string; // Highlight color for assistant messages
    debugMode: boolean;           // Enable or disable debug mode for verbose logging
    model: string;                // The model to use for vLLM API
    systemPrompt: string;         // The system prompt for the assistant
    maxTokens: number;            // Maximum number of tokens for the model
    apiToken: string;             // API token for authentication

    // Model parameters
    temperature: number;          // Temperature for sampling
    top_k: number;                // Top-k sampling
    top_p: number;                // Top-p (nucleus) sampling
    repeat_penalty: number;       // Repeat penalty
    presence_penalty: number;     // Presence penalty
    frequency_penalty: number;    // Frequency penalty
}

/** Default settings */
const DEFAULT_SETTINGS: CanvasChatPluginSettings = {
    vllmApiUrl: 'http://localhost:11434',
    userHighlightColor: '#FF5582A6',
    assistantHighlightColor: '#82FF55A6',
    debugMode: false,
    model: 'llama3.2',
    systemPrompt: 'You are a helpful assistant.',
    maxTokens: 2048,
    apiToken: '',

    // Default model parameters
    temperature: 0.8,
    top_k: 20,
    top_p: 0.9,
    repeat_penalty: 1.2,
    presence_penalty: 1.5,
    frequency_penalty: 1.0,
};

/*######################################################
# Plugin Setting Tab
######################################################*/

/**
 * Class representing the plugin's settings tab.
 */
class CanvasChatPluginSettingTab extends PluginSettingTab {
    plugin: CanvasChatPlugin;

    constructor(app: App, plugin: CanvasChatPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    /**
     * Display the settings tab in the plugin settings.
     */
    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Canvas Chat Plugin Settings' });

        // vLLM API URL Setting
        new Setting(containerEl)
            .setName('vLLM API URL')
            .setDesc('Enter the URL of your vLLM server (e.g., http://localhost:11434)')
            .addText(text => text
                .setPlaceholder('http://localhost:11434')
                .setValue(this.plugin.settings.vllmApiUrl)
                .onChange(async (value) => {
                    this.plugin.settings.vllmApiUrl = value;
                    await this.plugin.saveSettings();
                })
            );

        // Model Setting
        new Setting(containerEl)
            .setName('Model')
            .setDesc('Specify the model to use for the vLLM API (e.g., llama3.2)')
            .addText(text => text
                .setPlaceholder('llama3.2')
                .setValue(this.plugin.settings.model)
                .onChange(async (value) => {
                    this.plugin.settings.model = value;
                    await this.plugin.saveSettings();
                })
            );

        // System Prompt Setting
        new Setting(containerEl)
            .setName('System Prompt')
            .setDesc('Set the system prompt for the assistant')
            .addTextArea(text => text
                .setPlaceholder('You are a helpful assistant.')
                .setValue(this.plugin.settings.systemPrompt)
                .onChange(async (value) => {
                    this.plugin.settings.systemPrompt = value;
                    await this.plugin.saveSettings();
                })
            );

        // Max Tokens Setting
        new Setting(containerEl)
            .setName('Max Tokens')
            .setDesc('Set the maximum number of tokens for the model')
            .addText(text => {
                text.inputEl.type = 'number';
                text.inputEl.min = '1';
                text.setPlaceholder('2048')
                    .setValue(this.plugin.settings.maxTokens.toString())
                    .onChange(async (value) => {
                        const num = parseInt(value);
                        if (!isNaN(num) && num > 0) {
                            this.plugin.settings.maxTokens = num;
                            await this.plugin.saveSettings();
                        } else {
                            new Notice('Please enter a valid positive number for max tokens.');
                        }
                    });
            });

        // API Token Setting
        new Setting(containerEl)
            .setName('API Token')
            .setDesc('Enter your API token if required (e.g., for closed models)')
            .addText(text => text
                .setPlaceholder('Your API token')
                .setValue(this.plugin.settings.apiToken)
                .onChange(async (value) => {
                    this.plugin.settings.apiToken = value;
                    await this.plugin.saveSettings();
                })
            );

        // User Highlight Color Setting
        new Setting(containerEl)
            .setName('User Highlight Color')
            .setDesc('Set the highlight color for "User" labels')
            .addText(text => text
                .setPlaceholder('#FF5582A6')
                .setValue(this.plugin.settings.userHighlightColor)
                .onChange(async (value) => {
                    this.plugin.settings.userHighlightColor = value;
                    await this.plugin.saveSettings();
                })
            );

        // Assistant Highlight Color Setting
        new Setting(containerEl)
            .setName('Assistant Highlight Color')
            .setDesc('Set the highlight color for "Assistant" labels')
            .addText(text => text
                .setPlaceholder('#82FF55A6')
                .setValue(this.plugin.settings.assistantHighlightColor)
                .onChange(async (value) => {
                    this.plugin.settings.assistantHighlightColor = value;
                    await this.plugin.saveSettings();
                })
            );

        // Debug Mode Setting
        new Setting(containerEl)
            .setName('Debug Mode')
            .setDesc('Enable or disable debug mode for verbose logging')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.debugMode)
                .onChange(async (value) => {
                    this.plugin.settings.debugMode = value;
                    await this.plugin.saveSettings();
                })
            );

        // Add a heading for Model Parameters
        containerEl.createEl('h3', { text: 'Model Parameters' });

        // Temperature Setting
        new Setting(containerEl)
            .setName('Temperature')
            .setDesc('Set the temperature for sampling (e.g., 0.8)')
            .addText(text => {
                text.inputEl.type = 'number';
                text.inputEl.step = '0.1';
                text.setPlaceholder('0.8')
                    .setValue(this.plugin.settings.temperature.toString())
                    .onChange(async (value) => {
                        const num = parseFloat(value);
                        if (!isNaN(num) && num >= 0) {
                            this.plugin.settings.temperature = num;
                            await this.plugin.saveSettings();
                        } else {
                            new Notice('Please enter a valid non-negative number for temperature.');
                        }
                    });
            });

        // Top K Setting
        new Setting(containerEl)
            .setName('Top K')
            .setDesc('Set the top-k value for sampling (e.g., 20)')
            .addText(text => {
                text.inputEl.type = 'number';
                text.inputEl.min = '0';
                text.setPlaceholder('20')
                    .setValue(this.plugin.settings.top_k.toString())
                    .onChange(async (value) => {
                        const num = parseInt(value);
                        if (!isNaN(num) && num >= 0) {
                            this.plugin.settings.top_k = num;
                            await this.plugin.saveSettings();
                        } else {
                            new Notice('Please enter a valid non-negative integer for top_k.');
                        }
                    });
            });

        // Top P Setting
        new Setting(containerEl)
            .setName('Top P')
            .setDesc('Set the top-p (nucleus) value for sampling (e.g., 0.9)')
            .addText(text => {
                text.inputEl.type = 'number';
                text.inputEl.step = '0.1';
                text.setPlaceholder('0.9')
                    .setValue(this.plugin.settings.top_p.toString())
                    .onChange(async (value) => {
                        const num = parseFloat(value);
                        if (!isNaN(num) && num >= 0 && num <= 1) {
                            this.plugin.settings.top_p = num;
                            await this.plugin.saveSettings();
                        } else {
                            new Notice('Please enter a valid number between 0 and 1 for top_p.');
                        }
                    });
            });

        // Repeat Penalty Setting
        new Setting(containerEl)
            .setName('Repeat Penalty')
            .setDesc('Set the repeat penalty (e.g., 1.2)')
            .addText(text => {
                text.inputEl.type = 'number';
                text.inputEl.step = '0.1';
                text.setPlaceholder('1.2')
                    .setValue(this.plugin.settings.repeat_penalty.toString())
                    .onChange(async (value) => {
                        const num = parseFloat(value);
                        if (!isNaN(num) && num >= 0) {
                            this.plugin.settings.repeat_penalty = num;
                            await this.plugin.saveSettings();
                        } else {
                            new Notice('Please enter a valid non-negative number for repeat penalty.');
                        }
                    });
            });

        // Presence Penalty Setting
        new Setting(containerEl)
            .setName('Presence Penalty')
            .setDesc('Set the presence penalty (e.g., 1.5)')
            .addText(text => {
                text.inputEl.type = 'number';
                text.inputEl.step = '0.1';
                text.setPlaceholder('1.5')
                    .setValue(this.plugin.settings.presence_penalty.toString())
                    .onChange(async (value) => {
                        const num = parseFloat(value);
                        if (!isNaN(num)) {
                            this.plugin.settings.presence_penalty = num;
                            await this.plugin.saveSettings();
                        } else {
                            new Notice('Please enter a valid number for presence penalty.');
                        }
                    });
            });

        // Frequency Penalty Setting
        new Setting(containerEl)
            .setName('Frequency Penalty')
            .setDesc('Set the frequency penalty (e.g., 1.0)')
            .addText(text => {
                text.inputEl.type = 'number';
                text.inputEl.step = '0.1';
                text.setPlaceholder('1.0')
                    .setValue(this.plugin.settings.frequency_penalty.toString())
                    .onChange(async (value) => {
                        const num = parseFloat(value);
                        if (!isNaN(num)) {
                            this.plugin.settings.frequency_penalty = num;
                            await this.plugin.saveSettings();
                        } else {
                            new Notice('Please enter a valid number for frequency penalty.');
                        }
                    });
            });
    }
}

/*######################################################
# Main Plugin Class
######################################################*/

/**
 * Main class for the Canvas Chat Plugin.
 */
export default class CanvasChatPlugin extends Plugin {
    settings: CanvasChatPluginSettings;

    async onload() {
        console.log('Loading Canvas Chat Plugin');
        await this.loadSettings();
        this.addSettingTab(new CanvasChatPluginSettingTab(this.app, this));

        // Add ribbon icon to trigger chat function
        this.addRibbonIcon('dice', 'Chat with LLM', async () => {
            await this.handleChat();
        });

        // Add command to chat with LLM using the selected node
        this.addCommand({
            id: 'canvas-chat-plugin-chat-with-node',
            name: 'Chat with LLM using selected node',
            checkCallback: (checking: boolean) => {
                const canvasView = this.app.workspace.getActiveViewOfType(ItemView);
                if (canvasView?.getViewType() === 'canvas') {
                    if (!checking) {
                        this.handleChat();
                    }
                    return true;
                }
                return false;
            },
        });
    }

    async onunload() {
        console.log('Unloading Canvas Chat Plugin');
    }

    /**
     * Load settings from disk.
     */
    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    /**
     * Save settings to disk.
     */
    async saveSettings() {
        await this.saveData(this.settings);
    }

    /*######################################################
    # Node Handling Methods
    ######################################################*/

    /**
     * Get the type of a node (text, pdf, image).
     * @param node - The node to check.
     * @returns The type of the node as a string.
     */
    async getNodeType(node: any): Promise<string> {
        if (!node.filePath) return 'text';

        const fileExtension = node.filePath.split('.').pop().toLowerCase();
        if (fileExtension === 'pdf') return 'pdf';
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(fileExtension)) return 'image';

        return 'text';
    }

    /**
     * Get the content of a node based on its type.
     * @param node - The node to get content from.
     * @returns The content of the node or null if not retrievable.
     */
    async getNodeContent(node: any): Promise<string | null> {
        const nodeType = await this.getNodeType(node);
        if (nodeType === 'text') return node.text;
        return null;
    }

    /**
     * Check if a node has inbound connections.
     * @param node - The node to check.
     * @param canvas - The canvas containing the node.
     * @returns True if the node has inbound connections, false otherwise.
     */
    nodeHasInboundConnections(node: any, canvas: any): boolean {
        return Array.from(canvas.edges.values()).some((edge: any) => edge.to.node === node);
    }

    /**
     * Perform BFS to get inbound connected nodes.
     * @param canvas - The canvas containing the nodes.
     * @param startNode - The starting node.
     * @param excludeNodes - Nodes to exclude from the search.
     * @returns An array of connected nodes.
     */
    getInboundConnectedNodesBFS(canvas: any, startNode: any, excludeNodes = new Set()): any[] {
        const visitedNodes = new Set();
        const queue = [startNode];
        const nodesInOrder = [];

        visitedNodes.add(startNode);

        while (queue.length > 0) {
            const currentNode = queue.shift();
            nodesInOrder.push(currentNode);

            for (const edge of canvas.edges.values()) {
                if (edge.to.node === currentNode) {
                    const connectedNode = edge.from.node;
                    if (!visitedNodes.has(connectedNode) && !excludeNodes.has(connectedNode)) {
                        visitedNodes.add(connectedNode);
                        queue.push(connectedNode);
                    }
                }
            }
        }

        return nodesInOrder;
    }

    /**
     * Get inbound edges of a node.
     * @param node - The node to get edges for.
     * @returns An array of inbound edges.
     */
    getInboundEdges(node: any, canvas: any): any[] {
        return Array.from(canvas.edges.values()).filter((edge: any) => edge.to.node === node);
    }

    /**
     * Check if a node is a User node.
     * @param content - The content of the node.
     * @returns True if the node is a User node, false otherwise.
     */
    isUserNode(content: string): boolean {
        const cleanContent = this.cleanContent(content);
        return cleanContent.startsWith('User:');
    }

    /**
     * Check if a node is an Assistant placeholder.
     * @param content - The content of the node.
     * @returns True if the node is an Assistant placeholder, false otherwise.
     */
    isAssistantPlaceholder(content: string): boolean {
        const cleanContent = this.cleanContent(content);
        return cleanContent === 'Assistant:';
    }

    /**
     * Append the assistant's response as a new node connected to the original node.
     * @param node - The original node.
     * @param text - The assistant's response.
     */
    async appendToNode(node: any, text: string) {
        try {
            const canvas = node.canvas;
    
            // Clean any existing marks from the response
            let cleanText = this.cleanContent(text);
    
            // Create a new text node positioned below the original node
            const newNode = canvas.createTextNode({
                pos: { x: node.x, y: node.y + node.height + 100 },
                text: `<mark style="background: ${this.settings.assistantHighlightColor};">Assistant:</mark> ${cleanText}`,
                save: true,
                focus: false,
                size: { height: node.height, width: node.width },
            });
    
            // Create an edge connecting the original node to the new node
            const edge = {
                id: 'edge' + Date.now(),
                fromNode: node.id,
                fromSide: "bottom",
                toNode: newNode.id,
                toSide: "top"
            };
    
            // Add the new edge to the canvas data
            const data = canvas.getData();
            data.edges.push(edge);
            canvas.setData(data);
    
            if (this.settings.debugMode) {
                console.log('Appended assistant response as a new node:', newNode);
            }
        } catch (error) {
            console.error('Cannot create a new node with the response.', error);
            new Notice('Cannot create a new node with the response.');
        }
    }

    /*######################################################
    # Chat Interaction Methods
    ######################################################*/

    /**
     * Check if any of the selected nodes are directly connected.
     * @param selectedNodes - The selected nodes.
     * @param canvas - The canvas containing the nodes.
     * @returns True if any selected nodes are directly connected, false otherwise.
     */
    areNodesDirectlyConnected(selectedNodes: any[], canvas: any): boolean {
        for (const edge of canvas.edges.values()) {
            const fromNode = edge.from.node;
            const toNode = edge.to.node;
            if (selectedNodes.includes(fromNode) && selectedNodes.includes(toNode)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Validate that the conversation messages are in alternating order.
     * @param messages - The conversation messages.
     * @returns True if the messages alternate between user and assistant, false otherwise.
     */
    isConversationAlternating(messages: any[]): boolean {
        let lastRole = null;
        for (const message of messages) {
            if (message.role === 'system') continue;
            if (lastRole === null && message.role !== 'user') return false;
            if (lastRole !== null && message.role === lastRole) return false;
            lastRole = message.role;
        }
        return true;
    }

    /**
     * Call the vLLM API with the provided messages.
     * @param messages - The messages to send to the API.
     * @returns The assistant's response.
     */
    async callVLLMAPI(messages: any[]): Promise<string> {
        const apiUrl = `${this.settings.vllmApiUrl}/v1/chat/completions`;
        const requestBody: any = {
            model: this.settings.model,
            messages: messages,
            options: {
                num_ctx: this.settings.maxTokens,
                num_predict: -1,
                seed: 42,
                temperature: this.settings.temperature,
                top_k: this.settings.top_k,
                top_p: this.settings.top_p,
                repeat_penalty: this.settings.repeat_penalty,
                presence_penalty: this.settings.presence_penalty,
                frequency_penalty: this.settings.frequency_penalty,
            },
        };

        if (this.settings.debugMode) {
            console.log('Calling vLLM API with request body:', requestBody);
        }

        const headers: any = { 'Content-Type': 'application/json' };
        if (this.settings.apiToken && this.settings.apiToken.trim() !== '') {
            headers['Authorization'] = `Bearer ${this.settings.apiToken}`;
        }

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody),
        });

        const data = await response.json();

        if (this.settings.debugMode) {
            console.log('Received response from vLLM API:', data);
        }

        if (data.error) {
            console.error('Error calling vLLM API:', data.error);
            throw new Error(data.error.message);
        }

        return data.choices[0].message.content;
    }

    /**
     * Handle the chat interaction when the user initiates a chat.
     */
    async handleChat() {
        const canvasView = this.app.workspace.getActiveViewOfType(ItemView);

        if (!canvasView || canvasView.getViewType() !== 'canvas') {
            new Notice('No active canvas view found.');
            return;
        }

        const canvas = (canvasView as any).canvas;
        const selectedNodes: any[] = Array.from(canvas.selection);

        if (selectedNodes.length === 0) {
            new Notice('No node selected.');
            return;
        }

        if (this.areNodesDirectlyConnected(selectedNodes, canvas)) {
            new Notice('Selected nodes are directly connected.');
            throw new Error('Selected nodes are directly connected.');
        }

        // Process each selected node individually
        for (const selectedNode of selectedNodes) {
            try {
                await this.processSelectedNode(canvas, selectedNode, selectedNodes);
            } catch (error) {
                new Notice('Error: ' + error.message);
                if (this.settings.debugMode) {
                    console.error('Error processing selected node:', error);
                }
            }
        }
    }

    /**
     * Process the selected node as the user's input.
     * @param canvas - The canvas containing the nodes.
     * @param selectedNode - The selected node to process.
     * @param selectedNodes - All selected nodes.
     */
    async processSelectedNode(canvas: any, selectedNode: any, selectedNodes: any[]) {
        let userPrompt = await this.getNodeContent(selectedNode);
        if (userPrompt === null) {
            new Notice("Error reading user's input, make sure to select a textual node.");
            throw new Error("Error reading user's input, make sure to select a textual node.");
        }
    
        // Clean any existing marks from userPrompt
        let cleanUserPrompt = this.cleanContent(userPrompt);
    
        // Check if the prompt starts with 'User:'
        if (!cleanUserPrompt.startsWith('User:')) {
            // Add 'User:' prefix with highlight
            userPrompt = `<mark style="background: ${this.settings.userHighlightColor};">User:</mark> ${cleanUserPrompt}`;
            selectedNode.setData({ text: userPrompt });
        } else {
            // Ensure the 'User:' prefix is highlighted correctly
            const userContent = cleanUserPrompt.slice('User:'.length).trim();
            userPrompt = `<mark style="background: ${this.settings.userHighlightColor};">User:</mark> ${userContent}`;
            selectedNode.setData({ text: userPrompt });
        }
    
        // Handle connected nodes and context
        await this.processConnectedNodes(canvas, selectedNode, selectedNodes);
        await this.generateAssistantResponse(canvas, selectedNode, userPrompt, selectedNodes);
    }

    /**
     * Process connected nodes for assistant placeholders.
     * @param canvas - The canvas containing the nodes.
     * @param selectedNode - The selected node.
     * @param selectedNodes - All selected nodes.
     */
    async processConnectedNodes(canvas: any, selectedNode: any, selectedNodes: any[]) {
        const connectedNodes = this.getInboundConnectedNodesBFS(canvas, selectedNode, new Set(selectedNodes))
            .filter(node => node !== selectedNode)
            .reverse();

        for (const node of connectedNodes) {
            const content = await this.getNodeContent(node);
            if (content !== null && this.isAssistantPlaceholder(content)) {
                await this.processAssistantPlaceholder(node, canvas, selectedNodes);
            }
        }
    }

    /**
     * Process assistant placeholder nodes.
     * @param node - The assistant placeholder node.
     * @param canvas - The canvas containing the nodes.
     * @param selectedNodes - All selected nodes.
     */
    async processAssistantPlaceholder(node: any, canvas: any, selectedNodes: any[]) {
        const inboundEdges = this.getInboundEdges(node, canvas);
        const userInboundNodes = [];
    
        for (const edge of inboundEdges) {
            const fromNode = edge.from.node;
            const fromNodeContent = await this.getNodeContent(fromNode);
            if (fromNodeContent && this.isUserNode(fromNodeContent)) {
                userInboundNodes.push(fromNode);
            }
        }
    
        if (userInboundNodes.length === 1) {
            const userNode = userInboundNodes[0];
            let userNodeContent = await this.getNodeContent(userNode);
    
            if (userNodeContent === null) {
                new Notice("Error reading user's input in user node.");
                throw new Error("Error reading user's input in user node.");
            }
    
            // Clean any existing marks from userNodeContent
            let cleanUserNodeContent = this.cleanContent(userNodeContent);
    
            // Add "User:" prefix with highlight if not present
            if (!cleanUserNodeContent.startsWith('User:')) {
                userNodeContent = `<mark style="background: ${this.settings.userHighlightColor};">User:</mark> ${cleanUserNodeContent}`;
                userNode.setData({ text: userNodeContent });
            } else {
                // Ensure the 'User:' prefix is highlighted correctly
                const userContent = cleanUserNodeContent.slice('User:'.length).trim();
                userNodeContent = `<mark style="background: ${this.settings.userHighlightColor};">User:</mark> ${userContent}`;
                userNode.setData({ text: userNodeContent });
            }
    
            // Prepare messages and context
            const { conversationMessages, contextText } = await this.buildContextAndMessages(
                canvas, userNode, selectedNodes, [node]
            );
    
            // Construct prompt and messages
            const prompt = await this.constructPrompt(userNodeContent, contextText);
            const messages = [
                { role: 'system', content: this.settings.systemPrompt },
                ...conversationMessages,
                { role: 'user', content: prompt },
            ];
    
            // Validate messages
            if (!this.isConversationAlternating(messages)) {
                new Notice('Conversation history is not in alternating order of user and assistant messages.');
                throw new Error('Conversation history is not in alternating order of user and assistant messages.');
            }
    
            // Call vLLM API and update the assistant node
            try {
                const response = await this.callVLLMAPI(messages);
    
                // Clean any existing marks from assistant response
                let cleanResponse = this.cleanContent(response);
    
                // Add 'Assistant:' prefix with highlight
                let assistantResponse = `<mark style="background: ${this.settings.assistantHighlightColor};">Assistant:</mark> ${cleanResponse}`;
                node.setData({ text: assistantResponse });
    
                if (this.settings.debugMode) {
                    console.log('Updated assistant placeholder node with response:', node);
                }
            } catch (error) {
                new Notice('Error: ' + error.message);
                if (this.settings.debugMode) {
                    console.error('Error calling vLLM API:', error);
                }
            }
        } else if (userInboundNodes.length > 1) {
            new Notice('Assistant node has multiple incoming User nodes.');
            throw new Error('Assistant node has multiple incoming User nodes.');
        }
    }

    /**
     * Build context text and conversation messages.
     * @param canvas - The canvas containing the nodes.
     * @param startNode - The starting node for context.
     * @param excludeNodes - Nodes to exclude.
     * @param additionalExcludeNodes - Additional nodes to exclude.
     * @returns An object containing conversationMessages and contextText.
     */
    async buildContextAndMessages(canvas: any, startNode: any, excludeNodes: any[], additionalExcludeNodes: any[] = []) {
        const contextTextParts: string[] = [];
        const conversationMessages: any[] = [];
    
        const excludeSet = new Set([...excludeNodes, ...additionalExcludeNodes]);
        const contextNodes = this.getInboundConnectedNodesBFS(canvas, startNode, excludeSet)
            .filter(n => n !== startNode)
            .reverse();
    
        for (const node of contextNodes) {
            const content = await this.getNodeContent(node);
            if (content !== null) {
                const cleanContent = this.cleanContent(content);
    
                if (cleanContent.startsWith('User:')) {
                    const messageContent = cleanContent.slice('User:'.length).trim();
                    conversationMessages.push({ role: 'user', content: messageContent });
                } else if (cleanContent.startsWith('Assistant:')) {
                    const messageContent = cleanContent.slice('Assistant:'.length).trim();
                    conversationMessages.push({ role: 'assistant', content: messageContent });
                } else {
                    contextTextParts.push(cleanContent);
                }
            }
        }
    
        const contextText = contextTextParts.join('\n\n');
    
        if (this.settings.debugMode) {
            console.log('Built context and messages:', { conversationMessages, contextText });
        }
    
        return { conversationMessages, contextText };
    }

    /**
     * Clean content by removing markup and prefixes.
     * @param content - The content to clean.
     * @param prefixToRemove - The prefix to remove (optional).
     * @returns The cleaned content.
     */
    cleanContent(content: string, prefixToRemove: string = ''): string {
        return content
            .replace(/<mark[^>]*>/g, '')
            .replace(/<\/mark>/g, '')
            .replace(prefixToRemove, '')
            .trim();
    }

    /**
     * Construct the prompt to send to the assistant.
     * @param userPrompt - The user's prompt.
     * @param contextText - The context text.
     * @returns The constructed prompt.
     */
    async constructPrompt(userPrompt: string, contextText: string): Promise<string> {
        let prompt = '';

        if (contextText && contextText.trim().length > 0) {
            prompt += 'Given the following information:\n';
            prompt += `${contextText}\n\n`;
        }

        const cleanUserPrompt = this.cleanContent(userPrompt, 'User:');
        prompt += `${cleanUserPrompt}`;

        // Check the length of the prompt
        const maxCharacters = this.settings.maxTokens * 3.6;
        if (prompt.length > maxCharacters) {
            throw new Error(`The total length of the prompt exceeds the maximum allowed characters (${maxCharacters}). Please reduce the context or the user's question.`);
        }

        if (this.settings.debugMode) {
            console.log('Constructed prompt:', prompt);
        }

        return prompt;
    }

    /**
     * Generate assistant's response and append it to the selected node.
     * @param canvas - The canvas containing the nodes.
     * @param selectedNode - The selected node.
     * @param userPrompt - The user's prompt.
     * @param selectedNodes - All selected nodes.
     */
    async generateAssistantResponse(canvas: any, selectedNode: any, userPrompt: string, selectedNodes: any[]) {
        // Build context and messages
        const { conversationMessages, contextText } = await this.buildContextAndMessages(
            canvas, selectedNode, selectedNodes
        );

        // Construct prompt and messages
        const prompt = await this.constructPrompt(userPrompt, contextText);
        const messages = [
            { role: 'system', content: this.settings.systemPrompt },
            ...conversationMessages,
            { role: 'user', content: prompt },
        ];

        // Validate messages
        if (!this.isConversationAlternating(messages)) {
            new Notice('Conversation history is not in alternating order of user and assistant messages.');
            throw new Error('Conversation history is not in alternating order of user and assistant messages.');
        }

        // Call vLLM API and append the assistant's response
        try {
            const response = await this.callVLLMAPI(messages);
            await this.appendToNode(selectedNode, response);

            if (this.settings.debugMode) {
                console.log('Appended assistant response to node:', selectedNode);
            }
        } catch (error) {
            new Notice('Error: ' + error.message);
            if (this.settings.debugMode) {
                console.error('Error calling vLLM API:', error);
            }
        }
    }
}
