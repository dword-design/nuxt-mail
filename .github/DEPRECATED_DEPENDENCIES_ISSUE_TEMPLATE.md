---
title: Deprecated dependencies
labels: maintenance
---
The following dependencies are deprecated:

{% for dependency in env.DEPRECATED.split(',') %}
  - **{{ dependency }}**
{% endfor %}

Check out the [build]({{ env.RUN_URL }}) for details.