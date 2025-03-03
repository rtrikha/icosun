<p align="center">
<img width="20%" margin="0 auto" alt="icoSunLogo" src="https://github.com/user-attachments/assets/6753973c-1e67-451f-a9a4-a31542401187">
</p>

<h3>What is Icosun?</h3>
<p>Icosun is an open sourced replacement for Icomoon. Its a tool that allows you to convert SVG icons into web fonts. It ensures icons are scalable, accessible, and efficient for web and app development</p></br>

<h3>What does the plugin export?</h3>
<ul>
<li><b>Source SVGs</b> - A folder containing all raw SVGs used to generate the font files. Ideal for mobile tech stacks that don't support font files as an icon input.</li>
<li><b>JSON Unicode Map</b> - A key-value mapping between icon names and the unicode values, making it easy to reference icons in your code.
 
```json
"key": {
    "unit": "value"
  }
```
</li>
<li><b>TypeScript Unicode Map</b> - A TypeScript constant that maps SVGs to their unicode representations, allowing direct usage in TypeScript projects.</li>

```typescript
export const IconUnicode = {
  key: '"\\value"'
}
```
<li><b>Combined SVG</b> - A merged single SVG file that links path data to the unicode values, providing a visual reference for your font set.</li>
<li><b>Font Files</b> - IcoSun generates all major font file formats, ensuring compatibility across different platforms. It outputs TTF, EOT, OTF, WOFF and WOFF2.</li>
</ul>
</br>

<h3>What makes IcoSun different?</h3>
<p>
<ul>
  <li><b>Duplicate Prevention</b> - IcoSun detects duplicate icons and warns you before export, reducing manual errors in large icon sets.</li>
  <li><b>Simulate Output</b> - SVG-to-font conversion often faces path-winding issues, leading to incorrect subtractions. With IcoSun, you can preview the final output inside Figma before exporting, minimizing unexpected rendering issues.</li>
</ul>
</p>
</br>

<h3>Download the plugin 💫</h3>
<p>IcoSun is free and available in the Figma Community! 
You can find it <a href="https://www.figma.com/community/plugin/1467011906114601157/icosun">here</a></p>

