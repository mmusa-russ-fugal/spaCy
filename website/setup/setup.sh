set -e

python setup/jinja_to_js.py ../spacy/cli/templates/quickstart_training.jinja src/widgets/quickstart-training-generator.js ../spacy/cli/templates/quickstart_training_recommendations.yml
node setup/generateSiteModule.mjs
