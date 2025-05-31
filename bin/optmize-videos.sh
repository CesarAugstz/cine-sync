#!/bin/bash

# Video Optimization Script for Streaming
# Fixes moov atom position and optionally optimizes encoding for better seeking

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default settings
BACKUP=true
OPTIMIZATION_LEVEL="fast"
OUTPUT_DIR=""
VERBOSE=false
DRY_RUN=false

# Function to print colored output
print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Function to show usage
usage() {
    cat << EOF
Usage: $0 [OPTIONS] <file_or_directory>

DESCRIPTION:
    Optimizes MP4 files for better streaming and seeking performance.
    Fixes moov atom position and optionally re-encodes for better GOP structure.

OPTIONS:
    -l, --level LEVEL     Optimization level: fast, balanced, quality
                         fast:     Just fix moov atom (faststart) - recommended
                         balanced: Fix moov + optimize GOP structure  
                         quality:  Full re-encode with optimal settings
                         
    -o, --output DIR      Output directory (default: overwrites originals)
    -b, --backup         Create .backup files (default: true)
    -n, --no-backup      Don't create backup files
    -v, --verbose        Verbose output
    -d, --dry-run        Show what would be done without doing it
    -h, --help           Show this help

EXAMPLES:
    # Fix single file (recommended - fast and safe)
    $0 movie.mp4
    
    # Fix all movies in directory
    $0 /path/to/movies/
    
    # Full optimization with backups to output directory
    $0 -l quality -o /optimized/movies/ /original/movies/
    
    # Dry run to see what would be done
    $0 -d -v /path/to/movies/

OPTIMIZATION LEVELS:
    fast (recommended):
        - Moves moov atom to beginning (faststart)
        - No re-encoding, preserves quality
        - Fixes 90% of seeking issues
        - Very fast processing
        
    balanced:
        - Everything from 'fast'
        - Optimizes GOP structure for seeking
        - Minimal quality loss
        - Good balance of speed vs optimization
        
    quality:
        - Full re-encode with optimal settings
        - Perfect GOP structure (2-second keyframes)
        - Web-optimized H.264 profile
        - Highest quality output but slowest
EOF
}

# Function to check if file needs moov atom fix
needs_faststart() {
    local file="$1"
    local first_packet_pos
    first_packet_pos=$(ffprobe -v quiet -show_entries packet=pos -select_streams v:0 -of csv=p=0 "$file" 2>/dev/null | head -1)
    
    # If first packet is more than 1MB into file, needs faststart
    if [[ $first_packet_pos -gt 1048576 ]]; then
        return 0  # needs faststart
    else
        return 1  # already optimized
    fi
}

# Function to get video info
get_video_info() {
    local file="$1"
    ffprobe -v quiet -print_format json -show_format -show_streams "$file" 2>/dev/null
}

# Function to check GOP structure
check_gop_structure() {
    local file="$1"
    local keyframe_interval
    keyframe_interval=$(ffprobe -v quiet -select_streams v:0 -show_frames -show_entries frame=pict_type,pkt_pts_time "$file" 2>/dev/null | grep -A1 "pict_type=I" | grep "pkt_pts_time" | head -5 | cut -d= -f2 | awk 'NR>1{print ($1-p)} {p=$1}' | head -1)
    
    # Check if keyframe interval is reasonable (2-4 seconds)
    if (( $(echo "$keyframe_interval > 4.0" | bc -l) 2>/dev/null )); then
        return 0  # needs GOP optimization
    else
        return 1  # GOP is fine
    fi
}

# Function to optimize video based on level
optimize_video() {
    local input_file="$1"
    local output_file="$2"
    local level="$3"
    
    case $level in
        "fast")
            print_info "Applying faststart optimization..."
            ffmpeg -i "$input_file" -c copy -movflags +faststart -f mp4 "$output_file" -y
            ;;
            
        "balanced")
            print_info "Applying balanced optimization (faststart + GOP optimization)..."
            ffmpeg -i "$input_file" \
                -c:v libx264 -preset medium -crf 18 \
                -g 48 -keyint_min 24 -sc_threshold 0 \
                -c:a copy \
                -movflags +faststart \
                -f mp4 \
                "$output_file" -y
            ;;
            
        "quality")
            print_info "Applying full quality optimization..."
            ffmpeg -i "$input_file" \
                -c:v libx264 -preset slow -crf 16 \
                -profile:v high -level 4.0 \
                -g 48 -keyint_min 24 -sc_threshold 0 \
                -x264opts 'ref=4:bframes=2:b-adapt=2:direct=auto:me=umh:subme=8:trellis=2' \
                -c:a aac -b:a 128k \
                -movflags +faststart \
                -f mp4 \
                "$output_file" -y
            ;;
    esac
}

# Function to process single file
process_file() {
    local file="$1"
    local filename=$(basename "$file")
    local dirname=$(dirname "$file")
    
    # Determine output path
    local output_file
    if [[ -n "$OUTPUT_DIR" ]]; then
        mkdir -p "$OUTPUT_DIR"
        output_file="$OUTPUT_DIR/$filename"
    else
        output_file="$file"
    fi
    
    print_info "Processing: $filename"
    
    # Check if file exists
    if [[ ! -f "$file" ]]; then
        print_error "File not found: $file"
        return 1
    fi
    
    # Check if it's a video file
    if ! ffprobe -v quiet "$file" 2>/dev/null; then
        print_warning "Skipping non-video file: $filename"
        return 0
    fi
    
    # Get current file info
    if [[ "$VERBOSE" == true ]]; then
        print_info "Analyzing $filename..."
        local duration=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$file" 2>/dev/null)
        local size=$(du -h "$file" | cut -f1)
        print_info "Duration: ${duration}s, Size: $size"
    fi
    
    # Check if optimization is needed
    local needs_optimization=false
    local optimization_reasons=()
    
    if needs_faststart "$file"; then
        needs_optimization=true
        optimization_reasons+=("moov atom position")
    fi
    
    if [[ "$OPTIMIZATION_LEVEL" != "fast" ]] && check_gop_structure "$file"; then
        needs_optimization=true
        optimization_reasons+=("GOP structure")
    fi
    
    if [[ "$needs_optimization" == false ]]; then
        print_success "$filename is already optimized"
        return 0
    fi
    
    print_info "Needs optimization: ${optimization_reasons[*]}"
    
    if [[ "$DRY_RUN" == true ]]; then
        print_info "[DRY RUN] Would optimize: $filename (level: $OPTIMIZATION_LEVEL)"
        return 0
    fi
    
    # Create backup if requested and not using output directory
    if [[ "$BACKUP" == true && -z "$OUTPUT_DIR" ]]; then
        print_info "Creating backup..."
        cp "$file" "${file}.backup"
    fi
    
    # Create temporary file for processing (use .mp4 extension)
    local temp_file="${output_file%.*}_temp.mp4"
    
    # Optimize video
    if optimize_video "$file" "$temp_file" "$OPTIMIZATION_LEVEL"; then
        # Move temp file to final location
        mv "$temp_file" "$output_file"
        
        # Verify optimization
        if needs_faststart "$output_file"; then
            print_warning "Optimization may not have worked correctly for $filename"
        else
            print_success "Successfully optimized: $filename"
            
            if [[ "$VERBOSE" == true ]]; then
                local new_size=$(du -h "$output_file" | cut -f1)
                print_info "New size: $new_size"
            fi
        fi
    else
        print_error "Failed to optimize: $filename"
        rm -f "$temp_file"
        return 1
    fi
}

# Function to process directory
process_directory() {
    local dir="$1"
    local count=0
    local success=0
    
    print_info "Processing directory: $dir"
    
    # Find all MP4 files
    while IFS= read -r -d '' file; do
        ((count++))
        if process_file "$file"; then
            ((success++))
        fi
    done < <(find "$dir" -type f -name "*.mp4" -print0)
    
    print_info "Processed $success/$count files successfully"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -l|--level)
            OPTIMIZATION_LEVEL="$2"
            if [[ ! "$OPTIMIZATION_LEVEL" =~ ^(fast|balanced|quality)$ ]]; then
                print_error "Invalid optimization level: $OPTIMIZATION_LEVEL"
                print_error "Valid levels: fast, balanced, quality"
                exit 1
            fi
            shift 2
            ;;
        -o|--output)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        -b|--backup)
            BACKUP=true
            shift
            ;;
        -n|--no-backup)
            BACKUP=false
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        -*)
            print_error "Unknown option: $1"
            usage
            exit 1
            ;;
        *)
            break
            ;;
    esac
done

# Check if input file/directory is provided
if [[ $# -eq 0 ]]; then
    print_error "No input file or directory specified"
    usage
    exit 1
fi

INPUT_PATH="$1"

# Check dependencies
if ! command -v ffmpeg &> /dev/null; then
    print_error "ffmpeg is not installed or not in PATH"
    exit 1
fi

if ! command -v ffprobe &> /dev/null; then
    print_error "ffprobe is not installed or not in PATH"
    exit 1
fi

# Main processing
print_info "Video Optimization Script"
print_info "Level: $OPTIMIZATION_LEVEL"
print_info "Backup: $BACKUP"
print_info "Dry run: $DRY_RUN"

if [[ -f "$INPUT_PATH" ]]; then
    process_file "$INPUT_PATH"
elif [[ -d "$INPUT_PATH" ]]; then
    process_directory "$INPUT_PATH"
else
    print_error "Input path does not exist: $INPUT_PATH"
    exit 1
fi

print_success "Optimization complete!"

