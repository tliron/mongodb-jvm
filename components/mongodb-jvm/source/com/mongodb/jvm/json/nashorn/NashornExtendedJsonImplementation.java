/**
 * Copyright 2010-2017 Three Crickets LLC.
 * <p>
 * The contents of this file are subject to the terms of the Apache License
 * version 2.0: http://www.opensource.org/licenses/apache2.0.php
 * <p>
 * Alternatively, you can obtain a royalty free commercial license with less
 * limitations, transferable or non-transferable, directly from Three Crickets
 * at http://threecrickets.com/
 */

package com.mongodb.jvm.json.nashorn;

import java.util.Collection;

import com.mongodb.jvm.json.generic.GenericExtendedJsonImplementation;
import com.threecrickets.jvm.json.JsonEncoder;
import com.threecrickets.jvm.json.JsonTransformer;
import com.threecrickets.jvm.json.generic.GenericJsonImplementation;
import com.threecrickets.jvm.json.nashorn.NashornJsonImplementation;

/**
 * A JSON implementation for the
 * <a href="http://openjdk.java.net/projects/nashorn/">Nashorn JavaScript
 * engine</a>, with support for
 * <a href="http://docs.mongodb.org/manual/reference/mongodb-extended-json/">
 * MongoDB's extended JSON</a>.
 * 
 * @author Tal Liron
 */
public class NashornExtendedJsonImplementation extends NashornJsonImplementation
{
	//
	// Static operations
	//

	public static void addEncoders( Collection<JsonEncoder> encoders )
	{
		encoders.add( new UndefinedEncoder() );
		encoders.add( new NativeDateEncoder() );
		encoders.add( new NativeRegExpEncoder() );
	}

	public static void addTransformers( Collection<JsonTransformer> transformers )
	{
		transformers.add( new BinaryTransformer() );
		transformers.add( new BsonTimestampTransformer() );
		transformers.add( new DBRefTransformer() );
		transformers.add( new NativeDateTransformer() );
		transformers.add( new NativeNumberTransformer() );
		transformers.add( new NativeRegExpTransformer() );
		transformers.add( new ObjectIdTransformer() );
	}

	//
	// JsonImplementation
	//

	public void initialize()
	{
		addEncoders( encoders );
		NashornJsonImplementation.addEncoders( encoders );
		GenericExtendedJsonImplementation.addEncoders( encoders );
		GenericJsonImplementation.addEncoders( encoders );
		addTransformers( transformers );
		NashornJsonImplementation.addTransformers( transformers );
		GenericExtendedJsonImplementation.addTransformers( transformers );
	}

	public int getPriority()
	{
		return 1;
	}
}
