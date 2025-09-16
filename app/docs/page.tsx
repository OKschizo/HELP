export default function Docs(){
  return (
    <div className="prose prose-invert max-w-none">
      <h1>Docs</h1>
      <p>This MVP keeps assets/metadata on IPFS. No database is required; a DB is recommended later for drafts/analytics.</p>
      <h2>Flow</h2>
      <ol>
        <li>Upload assets + metadata to IPFS (server stub; bring your provider token).</li>
        <li>Deploy <code>Hyper721A</code> on HyperEVM (999/998).</li>
        <li>Set <code>baseURI</code> to <code>ipfs://&lt;META_CID&gt;/</code> and <code>revealed=true</code> when ready.</li>
      </ol>
      <h2>Security</h2>
      <ul>
        <li>Never ship long-lived IPFS tokens to the browser.</li>
        <li>Server runs the deploy script; browser never sees the deployer key.</li>
      </ul>
    </div>
  )
}
