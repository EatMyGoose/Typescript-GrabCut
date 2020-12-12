# Typescript-GrabCut
Implementation of GrabCut written from scratch in Typescript. Should run within any modern browser. Original algorithm detailed in the paper by Carsten et al (2004).

<p>
Grabcut is a cropping algorithm that tries to extract an object from its background with minimal user input.
</p>
<p>
Its working principles are based on combining the analysis of likely colours in the foreground an background, as well as detecting edges (sharp transistions in colours) within the image. 
These 2 bundles of information are translated into flow capacities in a flow network where the result of the minimum cut is used to determine the cropped image.
</p>

<img src="Images/Demo.png"></img>

Potentially useful tidbits you might find in this project - Typescript implementations of:
<ul>
<li>Dinic's max-flow/min cut algorithm</li>
<li>KMeans++ and GMM clustering algorithms</li>
<li>A Bare bones matrix library (supports matrix inverse, determinants, multiplication, addition etc.)</li>
</ul>

<h4>Work in progress</h4>
<ul>
<li>[Optimization of graph cut] Replace Dinic's algorithm with Boykov Kolmogorov's max flow algorithm (the repeated BFS on the source node kills performance)</li>
<li>Add zoom + panning features to user touchup</li>
<li>Support export of images without premultiplied alpha so colour data isn't lost</li>
<li>Add fiddly knobs to control more parameters of the Grabcut algorithm once performance improves (currently only 1 graphcut iteration is run)</li>
</ul>
