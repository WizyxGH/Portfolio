require 'jekyll'
require 'pathname'

module Jekyll
  module ObsidianProcessor
    # Callout generation is now handled entirely on the frontend by js/obsidian.js
    # This prevents Kramdown markdown="1" bugs and allows dynamic features (icons, foldables).

    def convert_wikilinks(content)
      return "" if content.nil?
      # Embeds: ![[File]] -> ![File](File)
      processed = content.gsub(/!\[\[([^\]]+)\]\]/) do |match|
        file = $1.strip
        "![#{file}](#{file})"
      end
      # Links: [[Link|Text]] -> [Text](Link) or [[Link]] -> [Link](Link)
      processed.gsub(/\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/) do |match|
        link = $1.strip
        text = ($2 || $1).strip
        "[#{text}](#{link})"
      end
    end
  end

  class ProjectPage < PageWithoutAFile
    def initialize(site, base, dir, project, content)
      @site = site
      @base = base
      @dir  = dir
      @name = 'index.html'

      super(site, base, dir, @name)
      
      self.data['layout'] = 'project'
      self.data.merge!(project)
      
      # Use pre-processed content
      markdown_converter = site.find_converter_instance(Jekyll::Converters::Markdown)
      self.content = markdown_converter.convert(content)
    end
  end

  class ProjectGenerator < Generator
    include ObsidianProcessor
    safe true

    def generate(site)
      return unless site.data['projects']

      site.data['projects'].each do |project|
        slug = project['slug'] || Utils.slugify(project['title'], mode: 'latin')
        md_path = File.join(site.source, '_projects', "#{slug}.md")
        
        # 1. Read and pre-process content (once per project)
        raw_content = File.exist?(md_path) ? File.read(md_path) : (project['text'] || "")
        processed_content = convert_wikilinks(raw_content)
        
        # 2. Sync for search (used in listings)
        project['text'] = processed_content

        # 3. Gallery auto-pop
        if !project.key?('gallery') || project['gallery'].empty?
           candidates = [slug, project['title'], project['title'].strip, project['title'].gsub(' ', '_')]
           results_base_rel = File.join('assets', 'media', 'projects', 'results')
           results_base_abs = File.join(site.source, results_base_rel)

           if File.directory?(results_base_abs)
              existing_dirs = Dir.entries(results_base_abs).select { |entry| File.directory?(File.join(results_base_abs, entry)) && !(entry =='.' || entry == '..') }
              candidates.uniq.each do |cand|
                  matched_dir = existing_dirs.find { |d| d.downcase == cand.downcase }
                  if matched_dir
                      gallery_path_rel = File.join(results_base_rel, matched_dir)
                      gallery_path_abs = File.join(results_base_abs, matched_dir)
                      
                      images = Dir.glob(File.join(gallery_path_abs, "**", "*.{jpg,jpeg,png,gif,webp,svg,mp4,webm,mov,pdf}")).map do |file|
                        relative = Pathname.new(file).relative_path_from(Pathname.new(gallery_path_abs)).to_s
                        "/#{gallery_path_rel.gsub('\\', '/')}/#{relative.gsub('\\', '/')}"
                      end
                      project['gallery'] = images.sort
                      break
                  end
              end
           end
        end

        # 4. Create the page with processed content
        base_dir = project['is_study'] ? 'creations_studies' : 'creations'
        dir = File.join(base_dir, slug)
        site.pages << ProjectPage.new(site, site.source, dir, project, processed_content)
      end
    end
  end
end
