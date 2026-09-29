import "./style.css";
import { pipeline, TextStreamer } from "@huggingface/transformers";

document.querySelector("#app").innerHTML = `
  <main>
    <h1>Qwen dans le navigateur</h1>

    <p id="status">Le modèle n’est pas encore chargé.</p>
    <button id="load">Charger Qwen</button>

    <div class="editor">
      <label for="system-prompt">System</label>
      <textarea
        id="system-prompt"
        rows="10"
        placeholder="Instructions générales données au modèle..."
        disabled
      ></textarea>
    </div>

    <div class="editor">
      <label for="context-prompt">Context</label>
      <textarea
        id="context-prompt"
        rows="5"
        placeholder="Contexte utile pour cette étape..."
        disabled
      ></textarea>
    </div>

    <div class="editor">
      <label for="prompt">User</label>
      <textarea
        id="prompt"
        rows="5"
        placeholder="Message de l’utilisateur..."
        disabled
      ></textarea>
    </div>

    <button id="send" disabled>Envoyer</button>

    <section id="result" hidden>
      <div id="reasoning-panel" hidden>
        <div class="panel-title">
          <span class="status-light"></span>
          Raisonnement interne
        </div>
        <pre id="reasoning"></pre>
      </div>

      <div id="final-panel" hidden>
        <div class="panel-title">Réponse</div>
        <div id="answer"></div>
      </div>
    </section>
  </main>
`;

const loadButton = document.querySelector("#load");
const sendButton = document.querySelector("#send");
const promptInput = document.querySelector("#prompt");
const systemPromptInput = document.querySelector("#system-prompt");
const contextPromptInput = document.querySelector("#context-prompt");
const status = document.querySelector("#status");

const result = document.querySelector("#result");
const reasoningPanel = document.querySelector("#reasoning-panel");
const reasoning = document.querySelector("#reasoning");
const finalPanel = document.querySelector("#final-panel");
const answer = document.querySelector("#answer");

let generator;
let rawOutput = "";

function renderOutput() {
  const openingTag = "<think>";
  const closingTag = "</think>";

  const openingIndex = rawOutput.indexOf(openingTag);
  const closingIndex = rawOutput.indexOf(closingTag);

  let reasoningText = "";
  let answerText = "";

  if (openingIndex !== -1) {
    const reasoningStart = openingIndex + openingTag.length;

    reasoningText =
      closingIndex === -1
        ? rawOutput.slice(reasoningStart)
        : rawOutput.slice(reasoningStart, closingIndex);

    if (closingIndex !== -1) {
      answerText = rawOutput.slice(closingIndex + closingTag.length);
    }
  } else {
    answerText = rawOutput;
  }

  reasoning.textContent = reasoningText.trim();
  answer.textContent = answerText.trim();

  reasoningPanel.hidden = reasoningText.trim().length === 0;
  finalPanel.hidden = answerText.trim().length === 0;
  result.hidden = reasoningPanel.hidden && finalPanel.hidden;
}

loadButton.addEventListener("click", async () => {
  if (!navigator.gpu) {
    status.textContent = "WebGPU n’est pas disponible dans ce navigateur.";
    return;
  }

  loadButton.disabled = true;
  status.textContent = "Préparation du téléchargement…";

  try {
    generator = await pipeline(
      "text-generation",
      "onnx-community/Qwen3-0.6B-ONNX",
      {
        device: "webgpu",
        dtype: "q4f16",

        progress_callback(progress) {
          if (
            progress.status === "progress" &&
            typeof progress.progress === "number"
          ) {
            status.textContent =
              `Chargement : ${Math.round(progress.progress)} %`;
          }
        },
      }
    );

    status.textContent = "Qwen est prêt.";
    systemPromptInput.disabled = false;
    contextPromptInput.disabled = false;
    promptInput.disabled = false;
    sendButton.disabled = false;
  } catch (error) {
    console.error(error);
    status.textContent = `Erreur : ${error.message}`;
    loadButton.disabled = false;
  }
});

sendButton.addEventListener("click", async () => {
  const prompt = promptInput.value.trim();

  if (!generator || !prompt) {
    return;
  }

  rawOutput = "";
  reasoning.textContent = "";
  answer.textContent = "";
  result.hidden = true;
  reasoningPanel.hidden = true;
  finalPanel.hidden = true;

  sendButton.disabled = true;
  status.textContent = "Génération en cours…";

  const systemPrompt = systemPromptInput.value.trim();
  const contextPrompt = contextPromptInput.value.trim();

  const systemContent = [
    systemPrompt,
    contextPrompt
      ? `CONTEXTE À PRENDRE EN COMPTE :\n${contextPrompt}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const messages = [
    {
      role: "system",
      content:
        systemContent ||
        "Vous êtes un assistant francophone utile et concis.",
    },
    {
      role: "user",
      content: prompt,
    },
  ];

  try {
    const streamer = new TextStreamer(generator.tokenizer, {
      skip_prompt: true,
      skip_special_tokens: true,

      callback_function(text) {
        rawOutput += text;
        renderOutput();
      },
    });

    await generator(messages, {
      max_new_tokens: 1024,
      do_sample: false,
      streamer,
    });

    status.textContent = "Réponse terminée.";
  } catch (error) {
    console.error(error);
    status.textContent = `Erreur : ${error.message}`;
  } finally {
    sendButton.disabled = false;
  }
});